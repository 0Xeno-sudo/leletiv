"""Persistent, loopback-only advanced research jobs and human review history."""
from pathlib import Path
from concurrent.futures import ThreadPoolExecutor
import json, sqlite3, threading, uuid, time, shutil
from contextlib import contextmanager
from fastapi import APIRouter, HTTPException, Request, Body
from fastapi.responses import FileResponse
from engine import InputError, Cancelled
from advanced_engine import run, recist_assessment

router=APIRouter(prefix='/advanced')
ROOT=Path(__file__).resolve().parent.parent/'data'/'advanced'
lock=threading.RLock(); pool=ThreadPoolExecutor(max_workers=1); signals={}; initialized=False
FIELDS={
 'longitudinal':({'baseline','baseline_mask','followup1','followup1_mask'}, {'followup2','followup2_mask','followup3','followup3_mask','followup4','followup4_mask'}),
 'body':({'ct'},{'organs','tissue'}),
 'pet':({'ct','pet'},{'mask'}),
 'pathology':({'slide'},set()),
 'mri':({'reference'},{'roi','normal_mask','adc','perfusion','dwi','dsc'}),
}


@contextmanager
def db():
    global initialized
    ROOT.mkdir(parents=True,exist_ok=True)
    connection=sqlite3.connect(ROOT/'jobs.sqlite3',timeout=10)
    connection.row_factory=sqlite3.Row
    connection.execute('CREATE TABLE IF NOT EXISTS jobs (id TEXT PRIMARY KEY, kind TEXT, status TEXT, stage TEXT, progress INTEGER, created REAL, updated REAL, options TEXT, report TEXT, error TEXT, review TEXT, version INTEGER DEFAULT 0)')
    connection.execute('CREATE TABLE IF NOT EXISTS reviews (id TEXT, version INTEGER, created REAL, payload TEXT, PRIMARY KEY(id,version))')
    with lock:
        if not initialized:
            connection.execute("UPDATE jobs SET status='interrupted',stage='A szolgáltatás újraindult; új futás szükséges.' WHERE status IN ('queued','running')")
            connection.commit(); initialized=True
    try:
        yield connection
        connection.commit()
    except BaseException:
        connection.rollback()
        raise
    finally:
        connection.close()


def row(job_id):
    with db() as conn:
        data=conn.execute('SELECT * FROM jobs WHERE id=?',(job_id,)).fetchone()
    if not data: raise HTTPException(404,'A futás nem található.')
    obj=dict(data)
    for k in ['options','report','review']: obj[k]=json.loads(obj[k]) if obj[k] else None
    if obj.get('report') and obj['kind']=='longitudinal':
        for visit in obj['report']['visits']:
            mapping=visit['matching']
            if isinstance(mapping,dict): visit['matching']=mapping['pairs']+[{'baselineLabel':x,'followupLabel':None} for x in mapping['unmatchedBaseline']]
    return obj


def update(job_id,**values):
    allowed={'status','stage','progress','report','error'}
    assert set(values)<=allowed
    with db() as conn:
        conn.execute('UPDATE jobs SET '+','.join(f'{k}=?' for k in values)+', updated=? WHERE id=?',[*[json.dumps(v,allow_nan=False) if k=='report' else v for k,v in values.items()],time.time(),job_id]);conn.commit()


def execute(job_id,paths,options):
    signal=signals[job_id]
    try:
        if signal.is_set(): raise Cancelled()
        update(job_id,status='running',stage='Bemenetek ellenőrzése',progress=5)
        report=run(row(job_id)['kind'],paths,options,ROOT/job_id,lambda p,s:update(job_id,progress=p,stage=s),signal)
        if signal.is_set(): raise Cancelled()
        update(job_id,status='completed',stage='Ellenőrzésre kész',progress=100,report=report)
    except Cancelled:
        update(job_id,status='cancelled',stage='Megszakítva')
    except Exception as error:
        update(job_id,status='failed',stage='A feldolgozás nem sikerült',error=str(error) if isinstance(error,InputError) else 'Feldolgozási hiba. Ellenőrizze a fájlformátumot és a helyi függőségeket.')
    finally:
        with lock: signals.pop(job_id,None)


@router.get('/capabilities')
def capabilities():
    import importlib.util
    with db() as conn: count=conn.execute('SELECT COUNT(*) FROM jobs').fetchone()[0]
    return {'localOnly':True,'persistentJobs':count,'workflows':list(FIELDS),'simpleitk':bool(importlib.util.find_spec('SimpleITK')),'totalSegmentator':bool(importlib.util.find_spec('totalsegmentator')),'histology':bool(importlib.util.find_spec('skimage')),'compositionWeights':(Path(__file__).parent/'models'/'composition'/'all'/'model_final_checkpoint.model').is_file(),'bodyWeights':bool(list((Path(__file__).parent/'models'/'total').glob('nnunet/results/**/checkpoint_final.pth')))}


@router.post('/slide-preview')
async def slide_preview(request:Request):
    import tempfile, io, base64, math
    from PIL import Image
    from starlette.concurrency import run_in_threadpool
    async with request.form(max_files=1,max_fields=1) as form:
        upload=form.get('slide')
        if form.get('researchConfirmed')!='true' or not hasattr(upload,'read'): raise HTTPException(400,'Szintetikus metszet és megerősítés szükséges.')
        suffix=Path(upload.filename or '').suffix.lower()
        if suffix not in ['.svs','.ndpi','.tif','.tiff','.png','.jpg','.jpeg']: raise HTTPException(400,'Nem támogatott metszetformátum.')
        with tempfile.TemporaryDirectory(prefix='leletiv-slide-') as directory:
            path=Path(directory)/('slide'+suffix);size=0
            with path.open('wb') as stream:
                while chunk:=await upload.read(1024*1024):
                    size+=len(chunk)
                    if size>128*1024*1024: raise HTTPException(413,'A metszet legfeljebb 128 MB lehet.')
                    stream.write(chunk)
            def preview():
                import openslide
                mpp=None
                try:
                    slide=openslide.OpenSlide(str(path))
                    try:
                        width,height=slide.dimensions
                        thumbnail=slide.get_thumbnail((1200,1200)).convert('RGB')
                        value=slide.properties.get(openslide.PROPERTY_NAME_MPP_X)
                        if value and math.isfinite(float(value)):mpp=float(value)
                    finally:slide.close()
                except openslide.OpenSlideUnsupportedFormatError:
                    with Image.open(path) as image:
                        width,height=image.size
                        if width*height>64_000_000:raise InputError('Túl nagy raszterkép; kisebb kivágat szükséges.')
                        image.thumbnail((1200,1200));thumbnail=image.convert('RGB')
                output=io.BytesIO();thumbnail.save(output,format='PNG')
                return {'width':width,'height':height,'micronsPerPixel':mpp,'image':'data:image/png;base64,'+base64.b64encode(output.getvalue()).decode()}
            try:return await run_in_threadpool(preview)
            except Exception as e:raise HTTPException(400,str(e) if isinstance(e,InputError) else 'A metszet előnézete nem olvasható.')


@router.get('/jobs')
def list_jobs():
    with db() as conn:
        items=conn.execute("SELECT id,kind,status,stage,progress,created,updated,error,version,json_extract(options,'$.title') AS title,json_extract(options,'$.caseId') AS caseId FROM jobs ORDER BY created DESC LIMIT 100").fetchall()
    return [dict(r) for r in items]


@router.post('/demo/{kind}',status_code=202)
def demo(kind:str,model:bool=False,context:dict=Body(default={})):
    demo_case=context.get("caseId")
    if demo_case and demo_case not in ("demo-leletiv-01","demo-leletiv-02","demo-leletiv-03"):
        raise HTTPException(400,"A minta csak kijelölt demóesethez kapcsolható.")
    if kind not in FIELDS: raise HTTPException(404,'Ismeretlen munkafolyamat.')
    with lock:
        if len(signals)>=3: raise HTTPException(409,'A feldolgozási sor megtelt.')
        job_id=str(uuid.uuid4());signals[job_id]=threading.Event()
    try:
        from advanced_demo import make_demo
        paths,options=make_demo(kind,ROOT/job_id,model)
        if demo_case:
            options["caseId"]=demo_case
            options["title"]="Demóbetegút · " + {"demo-leletiv-01":"Szalai Borbála","demo-leletiv-02":"Hegedűs András","demo-leletiv-03":"Fodor Júlia"}[demo_case] + " · geometriai próba"
        with db() as conn:
            conn.execute('INSERT INTO jobs (id,kind,status,stage,progress,created,updated,options) VALUES (?,?,?,?,?,?,?,?)',(job_id,kind,'queued','Szintetikus példa feldolgozása',0,time.time(),time.time(),json.dumps(options)));conn.commit()
        pool.submit(execute,job_id,paths,options)
        return row(job_id)
    except BaseException:
        with lock: signals.pop(job_id,None)
        shutil.rmtree(ROOT/job_id,ignore_errors=True)
        raise


@router.post('/jobs/{kind}',status_code=202)
async def create(kind:str,request:Request):
    if kind not in FIELDS: raise HTTPException(404,'Ismeretlen munkafolyamat.')
    with lock:
        if len(signals)>=3: raise HTTPException(409,'Legfeljebb három futás várakozhat. Várjon vagy szakítsa meg az előzőt.')
        job_id=str(uuid.uuid4()); signals[job_id]=threading.Event()
    directory=ROOT/job_id; directory.mkdir(parents=True)
    try:
        async with request.form(max_files=12,max_fields=2,max_part_size=128*1024*1024) as form:
            try: options=json.loads(form.get('options','{}'))
            except (TypeError,ValueError): raise HTTPException(400,'Hibás paraméterlista.')
            if not isinstance(options,dict) or len(json.dumps(options))>16000 or options.get('researchConfirmed') is not True:
                raise HTTPException(400,'A szintetikus kutatási használat megerősítése szükséges.')
            required,optional=FIELDS[kind]; paths={}
            for role in required|optional:
                upload=form.get(role)
                if upload is None:
                    if role in required: raise HTTPException(400,f'Hiányzó bemenet: {role}.')
                    continue
                if not hasattr(upload,'read') or not upload.filename: raise HTTPException(400,'Érvénytelen feltöltés.')
                name=upload.filename.lower()
                allowed=['.nii.gz','.nii','.zip'] if role!='slide' else ['.png','.jpg','.jpeg','.tif','.tiff','.svs','.ndpi']
                suffix=next((s for s in allowed if name.endswith(s)),None)
                if not suffix: raise HTTPException(400,f'Nem támogatott fájltípus: {role}.')
                path=directory/(role+suffix); size=0
                with path.open('wb') as stream:
                    while chunk:=await upload.read(1024*1024):
                        size+=len(chunk)
                        if size>128*1024*1024: raise HTTPException(413,'Egy bemenet legfeljebb 128 MB lehet.')
                        stream.write(chunk)
                if not size: raise HTTPException(400,'Üres bemenet.')
                paths[role]=path
        for i in range(1,5):
            if (f'followup{i}' in paths)!=(f'followup{i}_mask' in paths): raise HTTPException(400,'Minden kontrollhoz kép és maszk szükséges.')
        if 'dwi' in paths and 'adc' in paths or 'dsc' in paths and 'perfusion' in paths: raise HTTPException(400,'Nyers sorozatot vagy számított térképet adjon meg, egyszerre csak az egyiket.')
        with db() as conn:
            conn.execute('INSERT INTO jobs (id,kind,status,stage,progress,created,updated,options) VALUES (?,?,?,?,?,?,?,?)',(job_id,kind,'queued','Feldolgozásra vár',0,time.time(),time.time(),json.dumps(options,allow_nan=False)));conn.commit()
        pool.submit(execute,job_id,paths,options)
        return row(job_id)
    except BaseException:
        with lock: signals.pop(job_id,None)
        shutil.rmtree(directory,ignore_errors=True)
        raise


@router.get('/jobs/{job_id}')
def get(job_id:str): return row(job_id)


@router.post('/jobs/{job_id}/cancel')
def cancel(job_id:str):
    job=row(job_id)
    with lock:
        if job_id in signals: signals[job_id].set()
    return {'status':'cancellation-requested' if job['status'] in ['queued','running'] else job['status']}


@router.get('/jobs/{job_id}/artifacts/{name}')
def get_artifact(job_id:str,name:str):
    job=row(job_id)
    if job['status']!='completed': raise HTTPException(409,'Nincs kész eredmény.')
    allowed={a['file'] for a in job['report']['artifacts']}
    if name not in allowed: raise HTTPException(404,'Ismeretlen eredményfájl.')
    return FileResponse(ROOT/job_id/name,filename=name,media_type='image/png' if name.endswith('.png') else 'application/octet-stream')


@router.post('/jobs/{job_id}/review')
async def review(job_id:str,request:Request):
    try: payload=await request.json()
    except ValueError: raise HTTPException(400,'Hibás JSON.')
    if not isinstance(payload,dict): raise HTTPException(400,'Hibás ellenőrzési csomag.')
    if len(json.dumps(payload))>500000: raise HTTPException(413,'Túl nagy ellenőrzési csomag.')
    reviewer=str(payload.get('reviewer','')).strip(); note=str(payload.get('note','')).strip()
    if not reviewer or len(reviewer)>120 or len(note)>4000 or payload.get('confirmed') is not True:
        raise HTTPException(400,'Ellenőrző neve és a képi ellenőrzés megerősítése szükséges.')
    with lock:
        job=row(job_id)
        if job['status']!='completed': raise HTTPException(409,'Csak kész futás ellenőrizhető.')
        if payload.get('version')!=job['version']: raise HTTPException(409,'Az eredményt közben módosították; nyissa meg újra.')
        result={'reviewer':reviewer,'note':note,'confirmed':True,'time':time.time()}
        try:
            if job['kind']=='longitudinal':
                if payload.get('recist'):
                    targets=payload['recist'].get('targets',[])
                    target_ids=[t.get('id') for t in targets]
                    if len(set(target_ids))!=len(target_ids) or any(x not in {r['label'] for r in job['report']['baseline']} for x in target_ids) or any(len(t.get('followupMm',[]))!=len(job['report']['visits']) for t in targets):
                        raise InputError('A RECIST-mérések nem felelnek meg az aktuális régióknak és kontrolloknak.')
                result['recistInputs']=payload.get('recist')
                result['recist']=recist_assessment(payload.get('recist',{})) if payload.get('recist') else None
                result['matching']=payload.get('matching',[])
                allowed=[v['matching'] for v in job['report']['visits']]
                # Require every visit to carry an explicit reviewed one-to-one correspondence.
                matches=result['matching']
                if len(matches)!=len(allowed): raise InputError('Minden kontroll párosítását ellenőrizni kell.')
                base_ids={r['label'] for r in job['report']['baseline']}
                for visit,mapping in zip(job['report']['visits'],matches):
                    seen=set(); seen_base=set(); ids={r['label'] for r in visit['regions']}
                    for pair in mapping:
                        a,b=pair.get('baselineLabel'),pair.get('followupLabel')
                        if a not in base_ids or a in seen_base or (b is not None and (b not in ids or b in seen)): raise InputError('Érvénytelen vagy ismételt párosítás.')
                        seen_base.add(a)
                        if b is not None: seen.add(b)
                    if seen_base!=base_ids: raise InputError('Minden kiinduló régióhoz párosítás vagy nem azonosítható állapot szükséges.')
            elif job['kind']=='pet':
                selected=payload.get('includedRegions',[])
                ids={r['label'] for r in job['report']['regions']}
                if not isinstance(selected,list) or len(set(selected))!=len(selected) or any(x not in ids for x in selected): raise InputError('Ismeretlen aktivitásrégió.')
                rows=[r for r in job['report']['regions'] if r['label'] in selected]
                total=sum(r['volumeMl'] for r in rows)
                result.update(includedRegions=selected,metabolicVolumeMl=total,suvMeanWeighted=sum(r['suvMean']*r['volumeMl'] for r in rows)/total if total else None,tlg=sum(r['tlg'] for r in rows) if job['report']['tracer']=='FDG' else None)
            elif job['kind']=='pathology':
                changes=payload.get('cells',{})
                if not isinstance(changes,dict): raise InputError('Hibás sejtkorrekció.')
                ids={str(c['id']) for c in job['report']['cells']}
                if any(k not in ids or v not in ['positive','negative','excluded'] for k,v in changes.items()): raise InputError('Hibás sejtkorrekció.')
                counts={'positive':0,'negative':0,'excluded':0}
                for cell in job['report']['cells']:
                    state=changes.get(str(cell['id']),'positive' if cell['positive'] else 'negative');counts[state]+=1
                n=counts['positive']+counts['negative'];result.update(cells=changes,counts=counts,positivePercent=100*counts['positive']/n if n else None)
        except (InputError,TypeError,ValueError,KeyError) as error:
            raise HTTPException(400,str(error) if isinstance(error,InputError) else 'Hibás ellenőrzési adatok.')
        version=job['version']+1
        with db() as conn:
            conn.execute('INSERT INTO reviews VALUES (?,?,?,?)',(job_id,version,time.time(),json.dumps(result,allow_nan=False)))
            conn.execute('UPDATE jobs SET review=?,version=?,updated=? WHERE id=?',(json.dumps(result,allow_nan=False),version,time.time(),job_id));conn.commit()
    return row(job_id)


@router.get('/jobs/{job_id}/history')
def history(job_id:str):
    row(job_id)
    with db() as conn: records=conn.execute('SELECT version,created,payload FROM reviews WHERE id=? ORDER BY version',(job_id,)).fetchall()
    return [{**dict(r),'payload':json.loads(r['payload'])} for r in records]
