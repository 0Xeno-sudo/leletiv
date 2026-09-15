"""Local research inference. Never downloads code or evaluates bundle expressions."""
from pathlib import Path
import hashlib
import time
import gzip
import threading
import numpy as np
import nibabel as nib

CHANNELS = ('t1c', 't1', 't2', 'flair')
MODEL_REVISION = '370f7f9d062745fbac445e7fe6d6616d35df04ec'
MODEL_SHA256 = '860ccb3f1c21c99d0410ad8a1ac4ef6b8fab60cec0a503b0ba42675741a750ae'
MODEL_PATH = Path(__file__).parent / 'models' / 'brats-0.5.4.pt'
class InputError(ValueError): pass
MODEL_ID = 'MONAI/brats_mri_segmentation@0.5.4'
MAX_FILE = 64 * 1024 * 1024
MAX_EXPANDED = 160 * 1024 * 1024


def file_hash(path):
    with Path(path).open('rb') as handle:
        return hashlib.file_digest(handle, 'sha256').hexdigest()


def validate_inputs(paths):
    if set(paths) != set(CHANNELS):
        raise InputError('All four MRI sequences are required: T1c, T1, T2 and FLAIR.')
    arrays, base, header = [], None, None
    hashes = []
    for name in CHANNELS:
        path = Path(paths[name])
        if path.stat().st_size > MAX_FILE:
            raise InputError('Each MRI sequence must be at most 64 MB.')
        if path.suffix == '.gz':
            size = 0
            with gzip.open(path, 'rb') as stream:
                while chunk := stream.read(1024 * 1024):
                    size += len(chunk)
                    if size > MAX_EXPANDED:
                        raise InputError('The decompressed MRI volume is too large.')
        image = nib.load(path)
        if not isinstance(image, nib.Nifti1Image) or len(image.shape) != 3 or any(v < 16 for v in image.shape) or np.prod(image.shape) > 12_000_000:
            raise InputError('Use single 3D NIfTI-1 volumes: each dimension at least 16, total at most 12 million voxels.')
        if image.header.get_xyzt_units()[0] != 'mm' or not np.allclose(image.header.get_zooms(), [1, 1, 1], atol=1e-4):
            raise InputError('The model requires aligned 1 mm isotropic MRI scans with millimetre units.')
        if not np.isfinite(image.affine).all() or not np.allclose(image.affine[:3, :3], np.eye(3), atol=1e-4):
            raise InputError('Use preprocessed RAS-oriented, axis-aligned scans. Registration is not automatic.')
        if base is None:
            base, header = image, image.header.copy()
        elif image.shape != base.shape or not np.allclose(image.affine, base.affine, atol=1e-4):
            raise InputError('All sequences must share the same voxel grid and affine coordinates.')
        array = image.get_fdata(dtype=np.float32)
        if not np.isfinite(array).all():
            raise InputError('MRI intensities must be finite.')
        hashes.append(hashlib.sha256(array.tobytes()).hexdigest())
        arrays.append(array)
    if len(set(hashes)) != 4:
        raise InputError('Provide four distinct MRI sequences, not duplicate copies of one scan.')
    return np.stack(arrays), base.affine.copy(), header


def normalize_channels(data):
    result = data.copy()
    for channel in result:
        valid = channel != 0
        values = channel[valid].astype(np.float64)
        if values.size < 100 or values.std() < 1e-6:
            raise InputError('Every MRI sequence needs varying non-zero signal.')
        channel[valid] = (values - values.mean()) / values.std()
    if not np.isfinite(result).all():
        raise InputError('MRI normalization produced invalid values.')
    return result


def labels_from_logits(logits):
    if logits.ndim < 2 or logits.shape[0] != 3 or not np.isfinite(logits).all():
        raise InputError('Model output is non-finite or malformed. No mask was produced.')
    # Official bundle channels: TC, WT, ET. sigmoid(logit) > .5 == logit > 0.
    return np.where(logits[2] > 0, 4, np.where(logits[0] > 0, 1, np.where(logits[1] > 0, 2, 0))).astype(np.uint8)


def provenance_for(paths, profile):
    return {
        'schema': 'neuroflow.segmentation.v2', 'model': MODEL_ID,
        'modelRevision': MODEL_REVISION, 'modelSha256': MODEL_SHA256,
        'channelOrder': list(CHANNELS), 'profile': profile,
        'inputs': {key: {'sha256': file_hash(paths[key])} for key in CHANNELS},
        'reviewStatus': 'unreviewed', 'diagnosticUse': False,
        'labels': {'1': 'Non-enhancing / necrotic tumour core', '2': 'Peritumoral edema', '4': 'Enhancing tumour'},
        'threshold': 0.5, 'normalization': 'nonzero channel-wise z-score',
    }


class Cancelled(Exception):
    pass


class Engine:
    def __init__(self):
        self.network = None

    def load(self):
        if self.network is not None:
            return
        if not MODEL_PATH.is_file() or file_hash(MODEL_PATH) != MODEL_SHA256:
            raise InputError('The verified model weights are missing. Run the model setup command.')
        import torch
        from monai.networks.nets import SegResNet
        torch.set_num_threads(4)
        network = SegResNet(blocks_down=[1, 2, 2, 4], blocks_up=[1, 1, 1], init_filters=16, in_channels=4, out_channels=3, dropout_prob=0.2)
        network.load_state_dict(torch.load(MODEL_PATH, map_location='cpu', weights_only=True))
        self.network = network.eval()

    def infer(self, paths, output_dir, progress, cancel: threading.Event, profile='research'):
        import torch
        from monai.inferers import sliding_window_inference
        start = time.monotonic()
        progress(5, 'Validating MRI sequences')
        data, affine, header = validate_inputs(paths)
        if cancel.is_set():
            raise Cancelled()
        normalized = normalize_channels(data)
        progress(10, 'Loading verified model')
        self.load()
        # Research profile matches the published bundle. Smoke is explicitly not clinical input.
        roi = (32, 32, 32) if profile == 'synthetic-smoke' else (240, 240, 160)
        steps = 0
        def predictor(patch):
            nonlocal steps
            if cancel.is_set():
                raise Cancelled()
            steps += 1
            progress(min(85, 15 + steps * 5), 'Running pretrained segmentation')
            return self.network(patch)
        with torch.inference_mode():
            predicted = sliding_window_inference(torch.from_numpy(normalized)[None], roi, 1, predictor, overlap=0.5, mode='constant')
        if cancel.is_set():
            raise Cancelled()
        progress(90, 'Writing region mask')
        labels = labels_from_logits(predicted[0].numpy())
        mask_header = header.copy()
        mask_header.set_data_dtype(np.uint8)
        mask_header.set_slope_inter(1, 0)
        mask_header['descrip'] = b'NeuroFlow research prediction - NOT CLINICALLY VALIDATED'
        mask = nib.Nifti1Image(labels, affine, mask_header)
        nib.save(mask, Path(output_dir) / 'mask.nii.gz')
        report = provenance_for(paths, profile)
        report.update({'runtime': {'torch': torch.__version__, 'device': 'cpu', 'threads': 4}, 'window': list(roi), 'overlap': 0.5, 'elapsedSeconds': round(time.monotonic() - start, 2), 'maskSha256': file_hash(Path(output_dir) / 'mask.nii.gz'), 'geometry': {'dims': list(labels.shape), 'affine': affine.tolist(), 'units': 'mm'}, 'regions': [{'label': label, 'voxels': int((labels == label).sum()), 'millilitres': round(float((labels == label).sum()) / 1000, 3)} for label in [1, 2, 4]]})
        return report


def make_phantom(directory):
    """Geometric signals only: tests execution, not segmentation accuracy."""
    xyz = np.indices((32, 32, 32)).astype(np.float32)
    radius = np.sqrt(sum((axis - 15.5) ** 2 for axis in xyz))
    paths = {}
    for i, name in enumerate(CHANNELS):
        values = np.where(radius < 13, (100 + 30 * np.sin(radius / (i + 1.5)) + xyz[i % 3] * (i + 1)), 0).astype('float32')
        image = nib.Nifti1Image(values, np.eye(4))
        image.header.set_xyzt_units('mm')
        paths[name] = Path(directory) / f'{name}.nii'
        nib.save(image, paths[name])
    return paths
