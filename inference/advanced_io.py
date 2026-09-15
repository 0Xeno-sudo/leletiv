"""Bounded local medical-image IO. No network and no patient metadata in reports."""
from pathlib import Path
import gzip, hashlib, io, zipfile
import numpy as np
import nibabel as nib
from scipy.ndimage import affine_transform
from engine import InputError

MAX_VOXELS = 64_000_000
MAX_EXPANDED = 512 * 1024 * 1024


def digest(path):
    with open(path, 'rb') as stream:
        return hashlib.file_digest(stream, 'sha256').hexdigest()


def load_volume(path, dimensions=(3,)):
    path = Path(path)
    if path.suffix == '.zip':
        if 3 not in dimensions: raise InputError('Dinamikus sorozathoz 4D NIfTI szükséges.')
        return load_dicom(path)
    if path.suffix == '.gz':
        count = 0
        with gzip.open(path, 'rb') as stream:
            while chunk := stream.read(1024 * 1024):
                count += len(chunk)
                if count > MAX_EXPANDED:
                    raise InputError('A kicsomagolt térfogat meghaladja az 512 MB korlátot.')
    img = nib.load(path)
    if not isinstance(img, nib.Nifti1Image) or len(img.shape) not in dimensions or np.prod(img.shape) > MAX_VOXELS or min(img.shape[:3]) < 2:
        raise InputError('NIfTI-1 képanyag szükséges, legfeljebb 64 millió térbeli képponttal és a feladatnak megfelelő dimenzióval.')
    if img.header.get_xyzt_units()[0] != 'mm' or not np.isfinite(img.affine).all() or abs(np.linalg.det(img.affine[:3, :3])) < 1e-8:
        raise InputError('Ismert, milliméterben kalibrált geometria szükséges.')
    data = img.get_fdata(dtype=np.float32)
    if not np.isfinite(data).all():
        raise InputError('A kép nem véges intenzitásértékeket tartalmaz.')
    return data, img.affine, {'format': 'NIfTI-1', 'units': 'user-specified'}


def load_dicom(path):
    import pydicom
    slices = []
    with zipfile.ZipFile(path) as archive:
        members = [m for m in archive.infolist() if not m.is_dir() and not m.filename.startswith('__MACOSX/')]
        if not members or len(members) > 2500 or sum(m.file_size for m in members) > MAX_EXPANDED:
            raise InputError('A DICOM ZIP üres vagy túl nagy (2500 fájl / 512 MB).')
        for member in members:
            if member.file_size > 64 * 1024 * 1024:
                raise InputError('Túl nagy DICOM-fájl.')
            try:
                ds = pydicom.dcmread(io.BytesIO(archive.read(member)))
            except Exception:
                raise InputError('A ZIP csak egy DICOM képsorozat fájljait tartalmazhatja.')
            if not all(hasattr(ds, k) for k in ['ImagePositionPatient', 'ImageOrientationPatient', 'PixelSpacing', 'PixelData', 'SeriesInstanceUID']) or int(getattr(ds, 'NumberOfFrames', 1)) != 1:
                raise InputError('Egyképkockás, ismert geometriájú DICOM-sorozat szükséges; enhanced/multiframe jelenleg nem támogatott.')
            slices.append(ds)
    first = slices[0]
    if len({str(getattr(s,'FrameOfReferenceUID','')) for s in slices})!=1:
        raise InputError('A DICOM szeletek koordinátarendszere eltér.')
    if len(slices) < 2 or len({str(s.SeriesInstanceUID) for s in slices}) != 1:
        raise InputError('Egyetlen teljes, legalább két szeletes DICOM-sorozat szükséges.')
    orientation = np.asarray(first.ImageOrientationPatient, dtype=float)
    row, col = orientation[:3], orientation[3:]
    normal = np.cross(row, col)
    if not np.allclose([np.linalg.norm(row), np.linalg.norm(col), np.linalg.norm(normal)], 1, atol=1e-4):
        raise InputError('Érvénytelen DICOM-orientáció.')
    for s in slices:
        if not np.allclose(s.ImageOrientationPatient, orientation, atol=1e-4) or not np.allclose(s.PixelSpacing, first.PixelSpacing, atol=1e-5) or (s.Rows, s.Columns) != (first.Rows, first.Columns):
            raise InputError('A szeletek geometriája eltér.')
    slices.sort(key=lambda s: np.dot(np.asarray(s.ImagePositionPatient, float), normal))
    positions = np.array([s.ImagePositionPatient for s in slices], dtype=float)
    steps = np.diff(positions, axis=0)
    dz = float(np.median(steps @ normal))
    if dz <= 0 or not np.allclose(steps, normal * dz, atol=.05):
        raise InputError('Hiányzó/ismételt szelet, változó szelettávolság vagy döntött gantry; előzetes konverzió szükséges.')
    if first.Rows * first.Columns * len(slices) > MAX_VOXELS:
        raise InputError('Túl nagy DICOM-térfogat.')
    try:
        data = np.stack([s.pixel_array.astype(np.float32) * float(getattr(s, 'RescaleSlope', 1)) + float(getattr(s, 'RescaleIntercept', 0)) for s in slices], axis=2)
    except Exception:
        raise InputError('A DICOM pixelkódolás nem dekódolható; alakítsa át a 3D munkatérben.')
    affine = np.eye(4)
    affine[:3, :3] = np.column_stack((col * float(first.PixelSpacing[0]), row * float(first.PixelSpacing[1]), normal * dz))
    affine[:3, 3] = positions[0]
    affine = np.diag([-1, -1, 1, 1]) @ affine
    meta = {'format': 'DICOM', 'modality': str(getattr(first, 'Modality', '')), 'units': str(getattr(first, 'Units', 'HU' if getattr(first, 'Modality', '') == 'CT' else 'unknown'))}
    if not np.isfinite(data).all():
        raise InputError('Nem véges DICOM intenzitások.')
    return data, affine, meta


def save_volume(directory, name, data, affine):
    img = nib.Nifti1Image(np.asarray(data), affine)
    img.header.set_xyzt_units('mm')
    path = Path(directory) / (name + '.nii.gz')
    nib.save(img, path)
    return path.name


def same_grid(a, aa, b, ba):
    return a.shape[:3] == b.shape[:3] and np.allclose(aa, ba, atol=1e-4)


def resample(data, affine, shape, reference_affine, order=1):
    mapping = np.linalg.inv(affine) @ reference_affine
    return affine_transform(data, mapping[:3, :3], mapping[:3, 3], output_shape=shape, order=order, mode='constant', cval=0, prefilter=False)


def load_mask(path, source, affine):
    mask, ma, _ = load_volume(path)
    if not same_grid(source, affine, mask, ma) or np.any(mask < 0) or np.any(mask > 65535) or not np.equal(mask, np.floor(mask)).all():
        raise InputError('A címkemaszknak a forráskép rácsán kell lennie, nemnegatív egész címkékkel.')
    if len(np.unique(mask))>501: raise InputError('Legfeljebb 500 külön régió támogatott.')
    return mask.astype(np.uint16)


def finite_number(options, key, low, high, default=None):
    value = options.get(key, default)
    try:
        result = float(value)
    except (TypeError, ValueError):
        raise InputError(f'Hiányzó vagy hibás paraméter: {key}.')
    if not np.isfinite(result) or not low <= result <= high:
        raise InputError(f'Tartományon kívüli paraméter: {key} ({low}–{high}).')
    return result
