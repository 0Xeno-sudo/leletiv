"""Download a pinned public weight artifact, never remote executable code."""
import urllib.request
import tempfile
from pathlib import Path
from engine import MODEL_PATH, MODEL_REVISION, MODEL_SHA256, file_hash

if MODEL_PATH.is_file():
    if file_hash(MODEL_PATH) != MODEL_SHA256:
        raise SystemExit('Existing weights do not match the pinned checksum; refusing to overwrite.')
    print('Verified model already installed.')
else:
    MODEL_PATH.parent.mkdir(parents=True, exist_ok=True)
    url = f'https://huggingface.co/MONAI/brats_mri_segmentation/resolve/{MODEL_REVISION}/models/model.pt'
    with tempfile.TemporaryDirectory(prefix='leletiv-model-') as directory:
        target = Path(directory) / 'weights.pt'
        urllib.request.urlretrieve(url, target)
        if file_hash(target) != MODEL_SHA256:
            raise SystemExit('Model checksum verification failed.')
        import shutil
        shutil.copyfile(target, MODEL_PATH)
    print('Installed and SHA-256 verified MONAI BraTS 0.5.4 (18.8 MB).')
