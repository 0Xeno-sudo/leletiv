"""Optional examples. Generated data remain gitignored."""
from pathlib import Path
import subprocess, sys, urllib.request
root=Path(__file__).resolve().parents[1]
for script in ['inference/make_dicom_demo.py','scripts/make-imaging-demo.py']:
    subprocess.run([sys.executable,str(root/script)],cwd=root,check=True)
target=root/'public/volumes/mni152.nii.gz'
if not target.exists():
    urllib.request.urlretrieve('https://raw.githubusercontent.com/niivue/niivue-demo-images/main/mni152.nii.gz',target)
print('Synthetic examples and attributed MNI152 atlas are available locally. None are committed.')
