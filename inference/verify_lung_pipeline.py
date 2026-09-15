"""Real multipart CT -> model -> source/box artifact smoke check; synthetic only."""
import hashlib,tempfile,time
from pathlib import Path
import httpx,nibabel as nib,numpy as np
from lung_engine import make_lung_phantom
with tempfile.TemporaryDirectory(prefix='leletiv-lung-http-') as folder:
    source=make_lung_phantom(folder)['ct'];original=source.read_bytes()
    with httpx.Client(base_url='http://127.0.0.1:8789',headers={'X-Leletiv-Research':'1'},timeout=30) as client:
        response=client.post('/lung/jobs',data={'prepared':'yes'},files={'ct':('synthetic-ct.nii.gz',original,'application/octet-stream')});response.raise_for_status();job=response.json()
        try:
            deadline=time.monotonic()+120
            while job['status'] in ('queued','running') and time.monotonic()<deadline:
                time.sleep(.5);response=client.get('/jobs/'+job['id']);response.raise_for_status();job=response.json()
            assert job['status']=='completed',job
            report=job['report'];assert report['sourceSha256']==hashlib.sha256(original).hexdigest();assert report['diagnosticUse'] is False
            downloaded=client.get('/jobs/'+job['id']+'/source');downloaded.raise_for_status();assert downloaded.content==original
            mask=client.get('/jobs/'+job['id']+'/mask');mask.raise_for_status();output=Path(folder)/'boxes.nii.gz';output.write_bytes(mask.content)
            a,b=nib.load(source),nib.load(output);assert a.shape==b.shape;assert np.allclose(a.affine,b.affine)
            assert np.isfinite(b.get_fdata()).all();assert len(report['candidates'])<=50
            for candidate in report['candidates']:assert len(candidate['centerRasMm'])==3 and 0<=candidate['score']<=1
            print(f"PASS: real multipart lung inference, {len(report['candidates'])} synthetic candidate(s), {report['elapsedSeconds']}s, exact source hash and source-aligned box artifact. Not clinical validation.")
        finally:client.delete('/jobs/'+job['id'])
