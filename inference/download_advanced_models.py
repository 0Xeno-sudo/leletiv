"""Explicit public model download. No credentials, telemetry or patient input."""
from pathlib import Path
import urllib.request, zipfile, shutil, hashlib, json

from advanced_models import ARCHIVES,verify

ROOT=Path(__file__).parent/'models'
SOURCES=[
 ('total/nnunet/results','https://github.com/wasserth/TotalSegmentator/releases/download/v2.0.0-weights/Dataset297_TotalSegmentator_total_3mm_1559subj.zip','total.zip'),
 ('composition/all','https://huggingface.co/stanfordmimi/multilevel_muscle_adipose_tissue/resolve/8263e675956f871f37dbe0a4f698069efa8cf38e/all.zip','composition.zip'),
 ('composition','https://huggingface.co/stanfordmimi/multilevel_muscle_adipose_tissue/resolve/8263e675956f871f37dbe0a4f698069efa8cf38e/plans.pkl','plans.pkl'),
]

def main():
    ROOT.mkdir(parents=True,exist_ok=True); manifest=[]
    opener=urllib.request.build_opener(urllib.request.ProxyHandler({}))
    for directory,url,name in SOURCES:
        target=ROOT/directory;target.mkdir(parents=True,exist_ok=True)
        if name=='total.zip' and list(target.glob('Dataset297*/**/checkpoint_final.pth')): continue
        if name=='composition.zip' and (target/'model_final_checkpoint.model').exists(): continue
        if name=='plans.pkl' and (target/name).exists(): continue
        temp=ROOT/(name+'.download')
        print('Downloading public model:',name,flush=True)
        try:
            size=0
            with opener.open(url,timeout=60) as response,temp.open('wb') as output:
                while chunk:=response.read(1024*1024):
                    size+=len(chunk)
                    if size>2*1024**3: raise ValueError('Model download exceeds 2 GB.')
                    output.write(chunk)
            with temp.open('rb') as stream: sha=hashlib.file_digest(stream,'sha256').hexdigest()
            if sha!=ARCHIVES[name]: raise ValueError('Unexpected model download checksum.')
            if name.endswith('.zip'):
                with zipfile.ZipFile(temp) as archive:
                    if sum(x.file_size for x in archive.infolist())>4*1024**3: raise ValueError('Model archive too large.')
                    for member in archive.infolist():
                        p=Path(member.filename)
                        if p.is_absolute() or '..' in p.parts or (member.external_attr>>16)&0o170000==0o120000: raise ValueError('Unsafe archive member.')
                        # Only model architecture, weights and license files; no config or dotfiles.
                        if member.is_dir() or any(part.startswith('.') for part in p.parts): continue
                        if p.suffix not in ['.pth','.json','.pkl','.model','.txt']: continue
                        relative=p
                        if name=='composition.zip' and p.parts[0]=='all': relative=Path(*p.parts[1:])
                        dest=target/relative;dest.parent.mkdir(parents=True,exist_ok=True)
                        with archive.open(member) as source,dest.open('wb') as output: shutil.copyfileobj(source,output)
            else: shutil.copyfile(temp,target/name)
            manifest.append({'source':url,'downloadSha256':sha,'bytes':size})
        finally: temp.unlink(missing_ok=True)
    if manifest: (ROOT/'advanced-downloads.json').write_text(json.dumps(manifest,indent=2))
    verify('total');verify('composition')
    print('Local models ready. Research use only.',flush=True)

if __name__=='__main__': main()
