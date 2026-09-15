"""Exercise multipart → real weights → original-grid NIfTI on synthetic inputs."""
import io
import json
import tempfile
import time
from pathlib import Path
import httpx
import nibabel as nib
import numpy as np
from engine import make_phantom, MODEL_SHA256, file_hash

with tempfile.TemporaryDirectory(prefix='leletiv-proof-') as directory, httpx.Client(base_url='http://127.0.0.1:8789', trust_env=False, timeout=30) as client:
    paths = make_phantom(directory)
    response = client.post('/jobs', headers={'X-Leletiv-Research': '1'}, data={'prepared': 'yes'}, files={name: (path.name, path.read_bytes(), 'application/octet-stream') for name, path in paths.items()})
    response.raise_for_status()
    job_id = response.json()['id']
    print('Submitted official-window inference through multipart API:', job_id, flush=True)
    deadline = time.monotonic() + 240
    while time.monotonic() < deadline:
        result = client.get(f'/jobs/{job_id}').json()
        if result['status'] not in ('queued', 'running'):
            break
        time.sleep(2)
    assert result['status'] == 'completed', result
    report = result['report']
    assert report['window'] == [240, 240, 160]
    assert report['modelSha256'] == MODEL_SHA256
    assert report['inputs']['t1c']['sha256'] == file_hash(paths['t1c'])
    mask_response = client.get(f'/jobs/{job_id}/mask')
    mask_response.raise_for_status()
    mask_path = Path(directory) / 'result.nii.gz'
    mask_path.write_bytes(mask_response.content)
    mask = nib.load(mask_path)
    assert mask.shape == (32, 32, 32)
    np.testing.assert_allclose(mask.affine, np.eye(4))
    assert set(np.unique(mask.get_fdata())).issubset({0, 1, 2, 4})
    assert file_hash(mask_path) == report['maskSha256']
    assert client.get(f'/jobs/{job_id}/source').content == paths['t1c'].read_bytes()
    print(json.dumps({'status': 'passed', 'seconds': report['elapsedSeconds'], 'window': report['window'], 'outputShape': mask.shape, 'labels': report['regions'], 'modelChecksumVerified': True, 'originalAffinePreserved': True}, indent=2), flush=True)
    assert client.delete(f'/jobs/{job_id}', headers={'X-Leletiv-Research': '1'}).json()['status'] == 'cleared'
    assert client.get(f'/jobs/{job_id}').status_code == 404
    print('Ephemeral job cleanup verified.', flush=True)
