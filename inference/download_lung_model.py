"""Pinned Apache-2.0 MONAI weights, no model code execution or credential access."""
from pathlib import Path
import hashlib, urllib.request
REVISION='9d6622fda0e52be0a4155fed2e0afb9c17bcd80b'
SHA256='b5e79231466adae93a6fe8e8594029e9add142914e223b879aa0343bb2402d01'
target=Path(__file__).parent/'models'/'lung-retinanet.pt'
if target.is_file() and hashlib.sha256(target.read_bytes()).hexdigest()==SHA256:
 print('Lung model already verified')
else:
 target.parent.mkdir(exist_ok=True)
 request=urllib.request.Request(f'https://huggingface.co/MONAI/lung_nodule_ct_detection/resolve/{REVISION}/models/model.pt',headers={'User-Agent':'NeuroFlow-research'})
 temp=target.with_suffix('.download')
 try:
  with urllib.request.urlopen(request,timeout=60) as response,temp.open('wb') as output:
   count=0
   while chunk:=response.read(1024*1024):
    count+=len(chunk)
    if count>84_000_000:raise ValueError('Unexpected model size')
    output.write(chunk)
  if hashlib.sha256(temp.read_bytes()).hexdigest()!=SHA256:raise ValueError('Model checksum mismatch')
  temp.replace(target);print('Lung model downloaded and verified')
 finally:
  temp.unlink(missing_ok=True)
