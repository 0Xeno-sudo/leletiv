"""Ephemeral, loopback-only research service; no remote provider or credentials."""
import asyncio
import json
import threading
import time
import uuid
import tempfile
from pathlib import Path
from concurrent.futures import ThreadPoolExecutor
from fastapi import FastAPI, Request, HTTPException
from fastapi.responses import FileResponse, JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from engine import Engine, InputError, Cancelled, CHANNELS, MODEL_PATH, MODEL_ID, MAX_FILE, make_phantom

app = FastAPI(docs_url=None, redoc_url=None, openapi_url=None)
ORIGINS = ['http://127.0.0.1:5173', 'http://localhost:5173']
app.add_middleware(CORSMiddleware, allow_origins=ORIGINS, allow_methods=['GET', 'POST', 'DELETE'], allow_headers=['Content-Type', 'X-Leletiv-Research'])
from lung_engine import LungEngine, MODEL_PATH as LUNG_PATH, make_lung_phantom
engine = Engine()
lung_engine = LungEngine()
pool = ThreadPoolExecutor(max_workers=1)
jobs = {}
gate = threading.Lock()
active = threading.Semaphore(1)


@app.middleware('http')
async def boundary(request: Request, call_next):
    if request.headers.get('host') not in ('127.0.0.1:8789', 'localhost:8789'):
        return JSONResponse({'detail': 'Loopback host required.'}, status_code=403)
    origin = request.headers.get('origin')
    if origin and origin not in ORIGINS:
        return JSONResponse({'detail': 'Origin not allowed.'}, status_code=403)
    if request.method in ('POST', 'DELETE'):
        if request.headers.get('x-leletiv-research') != '1':
            return JSONResponse({'detail': 'Research request header required.'}, status_code=403)
        if request.method == 'POST':
            try:
                length = int(request.headers.get('content-length', '-1'))
            except ValueError:
                length = -1
            if length < 0 or length > 260 * 1024 * 1024:
                return JSONResponse({'detail': 'A bounded request body is required (maximum 260 MB).'}, status_code=413)
    response = await call_next(request)
    response.headers['Cache-Control'] = 'no-store'
    response.headers['X-Content-Type-Options'] = 'nosniff'
    return response


def cleanup():
    with gate:
        for key, job in list(jobs.items()):
            if job['status'] in ('completed', 'failed', 'cancelled') and time.time() - job['updated'] > 3600:
                job['temp'].cleanup()
                del jobs[key]


def public(job):
    return {key: job[key] for key in ('id', 'status', 'progress', 'stage', 'profile', 'error', 'report', 'kind')}


@app.get('/health')
def health():
    cleanup()
    return {'status': 'ok', 'model': MODEL_ID, 'lungWeightsInstalled': LUNG_PATH.is_file(), 'weightsInstalled': MODEL_PATH.is_file(), 'device': 'cpu', 'researchOnly': True}


@app.get('/jobs')
def list_jobs():
    cleanup()
    with gate:
        return [public(job) for job in reversed(list(jobs.values()))]


def create_job(profile,kind="brats"):
    selected_model=LUNG_PATH if kind=="lung" else MODEL_PATH
    cleanup()
    if not selected_model.is_file():
        raise HTTPException(503, 'The model is not installed. Run the model setup command.')
    if not active.acquire(blocking=False):
        raise HTTPException(409, 'Another segmentation is running. Wait or cancel it first.')
    if len(jobs) >= 5:
        active.release()
        raise HTTPException(409, 'Clear an existing job before starting another.')
    job = {'kind':kind, 'id': str(uuid.uuid4()), 'status': 'queued', 'progress': 0, 'stage': 'Preparing local job', 'profile': profile, 'error': None, 'report': None, 'temp': tempfile.TemporaryDirectory(prefix='leletiv-inference-'), 'cancel': threading.Event(), 'updated': time.time()}
    with gate:
        jobs[job['id']] = job
    return job


def execute(job, paths):
    try:
        job['status'] = 'running'
        def progress(value, stage):
            with gate:
                job.update(progress=value, stage=stage, updated=time.time())
        report = (lung_engine if job['kind']=='lung' else engine).infer(paths, job['temp'].name, progress, job['cancel'], job['profile'])
        if job['cancel'].is_set():
            raise Cancelled()
        with gate:
            job.update(status='completed', progress=100, stage='Ready for human review', report=report, updated=time.time())
    except Cancelled:
        job.update(status='cancelled', stage='Cancelled', updated=time.time())
        job['temp'].cleanup()
    except Exception as error:
        # Input validation messages are authored; library exceptions may contain file metadata.
        message = str(error) if isinstance(error, InputError) else 'Segmentation failed. Verify the input format and model installation.'
        job.update(status='failed', error=message, stage='Failed', updated=time.time())
        job['temp'].cleanup()
    finally:
        active.release()


@app.post('/jobs', status_code=202)
async def start_job(request: Request):
    job = create_job('research')
    try:
        async with request.form(max_files=4, max_fields=2, max_part_size=MAX_FILE) as form:
            if form.get('prepared') != 'yes':
                raise HTTPException(400, 'Confirm that inputs are de-identified, skull-stripped and co-registered.')
            paths = {}
            for channel in CHANNELS:
                upload = form.get(channel)
                if not upload or not hasattr(upload, 'read') or not upload.filename or not upload.filename.lower().endswith(('.nii', '.nii.gz')):
                    raise HTTPException(400, 'All four MRI sequences are required as NIfTI files.')
                suffix = '.nii.gz' if upload.filename.lower().endswith('.gz') else '.nii'
                path = Path(job['temp'].name) / f'{channel}{suffix}'
                size = 0
                with path.open('wb') as handle:
                    while chunk := await upload.read(1024 * 1024):
                        size += len(chunk)
                        if size > MAX_FILE:
                            raise HTTPException(413, 'Each MRI sequence must be at most 64 MB.')
                        handle.write(chunk)
                paths[channel] = path
        pool.submit(execute, job, paths)
        return public(job)
    except BaseException:
        job['temp'].cleanup()
        with gate:
            jobs.pop(job['id'], None)
        active.release()
        raise


@app.post('/smoke', status_code=202)
def smoke():
    job = create_job('synthetic-smoke')
    try:
        paths = make_phantom(job['temp'].name)
        pool.submit(execute, job, paths)
    except Exception:
        job['temp'].cleanup()
        jobs.pop(job['id'], None)
        active.release()
        raise
    return public(job)


def get_job(job_id):
    cleanup()
    if job_id not in jobs:
        raise HTTPException(404, 'Job expired or not found.')
    return jobs[job_id]


@app.post('/lung/jobs', status_code=202)
async def start_lung(request: Request):
    job=create_job('research','lung')
    try:
        async with request.form(max_files=1,max_fields=2,max_part_size=MAX_FILE) as form:
            upload=form.get('ct')
            if form.get('prepared')!='yes' or not upload or not hasattr(upload,'read') or not upload.filename or not upload.filename.lower().endswith(('.nii','.nii.gz')):
                raise HTTPException(400,'Confirm a de-identified chest CT in Hounsfield units, as NIfTI.')
            path=Path(job['temp'].name)/('ct.nii.gz' if upload.filename.lower().endswith('.gz') else 'ct.nii')
            count=0
            with path.open('wb') as handle:
                while chunk:=await upload.read(1024*1024):
                    count+=len(chunk)
                    if count>MAX_FILE:raise HTTPException(413,'CT maximum is 64 MB.')
                    handle.write(chunk)
        pool.submit(execute,job,{'ct':path});return public(job)
    except BaseException:
        job['temp'].cleanup();jobs.pop(job['id'],None);active.release();raise

@app.post('/lung/smoke',status_code=202)
def lung_smoke():
    job=create_job('synthetic-smoke','lung')
    try:pool.submit(execute,job,make_lung_phantom(job['temp'].name))
    except BaseException:
        job['temp'].cleanup();jobs.pop(job['id'],None);active.release();raise
    return public(job)

@app.get('/jobs/{job_id}')
def status(job_id: str):
    return public(get_job(job_id))


@app.get('/jobs/{job_id}/{artifact}')
def artifact(job_id: str, artifact: str):
    job = get_job(job_id)
    if job['status'] != 'completed':
        raise HTTPException(409, 'The result is not ready.')
    if artifact == 'report':
        return job['report']
    if artifact not in ('mask', 'source'):
        raise HTTPException(404, 'Unknown artifact.')
    root = Path(job['temp'].name)
    path = root / 'mask.nii.gz' if artifact == 'mask' else next(root.glob('ct.nii*' if job['kind']=='lung' else 't1c.nii*'))
    return FileResponse(path, media_type='application/octet-stream', filename=path.name)


@app.delete('/jobs/{job_id}')
def cancel_or_clear(job_id: str):
    job = get_job(job_id)
    job['cancel'].set()
    if job['status'] in ('completed', 'failed', 'cancelled'):
        job['temp'].cleanup()
        with gate:
            jobs.pop(job_id, None)
        return {'status': 'cleared'}
    return {'status': 'cancelling'}


from advanced_api import router as advanced_router
app.include_router(advanced_router)

if __name__ == '__main__':
    import uvicorn
    uvicorn.run(app, host='127.0.0.1', port=8789, access_log=False)
