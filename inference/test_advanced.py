import json, threading, time, io, zipfile
from pathlib import Path
import numpy as np
import pytest
from fastapi.testclient import TestClient
from engine import InputError, Cancelled
from advanced_io import load_volume, load_mask, save_volume, resample
from advanced_engine import run, recist_assessment, adc_from_dwi, pair_labels
from advanced_demo import make_demo
import advanced_api
from server import app


def test_recist_thresholds_nadir_and_nodes():
    source={'targets':[{'organ':'lung','baselineMm':40,'followupMm':[28,33,34]}],'nonTarget':['absent']*3,'newLesions':['no']*3}
    result=recist_assessment(source)['visits']
    assert [v['overallResponse'] for v in result]==['PR','SD','PD']
    assert result[2]['nadirBeforeMm']==28
    source['targets']=[{'organ':'lymph-nodes','lymphNode':True,'baselineMm':20,'followupMm':[9]}]
    source['nonTarget']=['absent'];source['newLesions']=['no']
    assert recist_assessment(source)['visits'][0]['overallResponse']=='CR'
    source['newLesions']=['uncertain']
    assert recist_assessment(source)['visits'][0]['overallResponse']=='NE'
    source['newLesions']=['yes']
    assert recist_assessment(source)['visits'][0]['overallResponse']=='PD'


def test_recist_rejects_incomplete_and_excess_targets():
    row={'organ':'lung','baselineMm':12,'followupMm':[None]}
    with pytest.raises(InputError):recist_assessment({'targets':[row]})
    with pytest.raises(InputError):recist_assessment({'targets':[dict(row,followupMm=[10])]*3})
    with pytest.raises(InputError):recist_assessment({'targets':[dict(row,baselineMm=8,followupMm=[5])]})


def test_adc_known_exponential_and_invalid_input():
    b=[0,500,1000]; data=np.stack([np.full((4,4,4),1000*np.exp(-v*.0008)) for v in b],axis=3)
    adc,valid=adc_from_dwi(data,b)
    assert valid.all();assert np.allclose(adc,.0008,atol=1e-8)
    with pytest.raises(InputError):adc_from_dwi(data,[0,0,0])
    data[0,0,0,0]=0;assert not adc_from_dwi(data,b)[1][0,0,0]


@pytest.mark.parametrize('kind',['longitudinal','body','pet','pathology','mri'])
def test_known_synthetic_workflows(kind,tmp_path):
    paths,options=make_demo(kind,tmp_path)
    result=run(kind,paths,options,tmp_path,lambda *a:None,threading.Event())
    assert result['diagnosticUse'] is False
    assert all(len(a['sha256'])==64 and (tmp_path/a['file']).is_file() for a in result['artifacts'])
    json.dumps(result,allow_nan=False)
    if kind=='longitudinal':
        assert result['visits'][0]['registration']['coverageFraction']>.9
        assert {p['baselineLabel']:p['followupLabel'] for p in result['visits'][0]['matching']}=={1:1,2:2}
        assert result['visits'][0]['regions'][0]['volumeMl']<result['baseline'][0]['volumeMl']
    elif kind=='body':
        c=result['composition'];assert c['totalMuscleAreaCm2']>0
        assert c['skeletalMuscleIndexCm2M2']==pytest.approx(c['totalMuscleAreaCm2']/1.7**2)
    elif kind=='pet':
        assert len(result['regions'])==2
        assert sorted(r['suvMean'] for r in result['regions'])==[5,9]
        assert all(r['included'] is False for r in result['regions'])
    elif kind=='pathology':
        assert result['summary']['cells']==88;assert result['summary']['positive']==29
    elif kind=='mri':
        measurements=result['measurements']
        assert next(r['median'] for r in measurements if r['map']=='ADC' and r['region']==1)==pytest.approx(.0007,abs=1e-7)
        assert next(r['median'] for r in measurements if r['map']=='rCBV' and r['region']==1)==pytest.approx(2,rel=.02)


def test_geometry_and_cancellation(tmp_path):
    data=np.ones((4,4,4),np.float32);a=np.diag([2,2,2,1]);p=tmp_path/save_volume(tmp_path,'image',data,a)
    with pytest.raises(InputError):load_mask(p,data,np.eye(4))
    mask=np.zeros((20,20,20),np.uint16);mask[1:3,1:3,1:3]=1
    other=np.zeros_like(mask);other[17:19,17:19,17:19]=2
    assert pair_labels(mask,other,np.eye(4),5)['unmatchedBaseline']==[1]
    cancel=threading.Event();cancel.set()
    with pytest.raises(Cancelled):run('body',{}, {},tmp_path,lambda *a:None,cancel)


def test_pathology_roi_bounds_are_not_silently_ignored(tmp_path):
    paths,options=make_demo('pathology',tmp_path);options['roiX']=100
    with pytest.raises(InputError):run('pathology',paths,options,tmp_path,lambda *a:None,threading.Event())


@pytest.fixture
def client(tmp_path,monkeypatch):
    monkeypatch.setattr(advanced_api,'ROOT',tmp_path/'jobs');monkeypatch.setattr(advanced_api,'initialized',False)
    with TestClient(app,base_url='http://127.0.0.1:8789') as c:yield c
    for _ in range(100):
        if not advanced_api.signals:break
        time.sleep(.02)

HEADERS={'X-NeuroFlow-Research':'1','Origin':'http://127.0.0.1:5173'}
def wait_job(client,job_id):
    for _ in range(150):
        result=client.get('/advanced/jobs/'+job_id).json()
        if result['status'] not in ['running','queued']:return result
        time.sleep(.04)
    pytest.fail('Job did not finish')


def test_persistent_upload_review_conflict_and_artifact_boundary(client,tmp_path,monkeypatch):
    paths,options=make_demo('pet',tmp_path/'inputs')
    with paths['ct'].open('rb') as ct,paths['pet'].open('rb') as pet:
        response=client.post('/advanced/jobs/pet',headers=HEADERS,data={'options':json.dumps(options)},files={'ct':('ct.nii.gz',ct),'pet':('pet.nii.gz',pet)})
    assert response.status_code==202,response.text
    job=wait_job(client,response.json()['id']);assert job['status']=='completed',job
    url='/advanced/jobs/'+job['id']
    payload={'version':0,'reviewer':'Tesztelő','confirmed':True,'includedRegions':[1]}
    saved=client.post(url+'/review',json=payload,headers=HEADERS)
    assert saved.status_code==200,saved.text
    assert saved.json()['review']['metabolicVolumeMl']==job['report']['regions'][0]['volumeMl']
    assert client.post(url+'/review',json=payload,headers=HEADERS).status_code==409
    assert len(client.get(url+'/history').json())==1
    monkeypatch.setattr(advanced_api,'initialized',False)
    assert client.get(url).json()['version']==1
    assert client.get(url+'/artifacts/input-ct.nii.gz').status_code==404
    assert client.get(url+'/artifacts/reference.nii.gz').status_code==200
    assert client.post(url+'/review',json=payload).status_code==403
    assert client.get(url,headers={'Origin':'https://example.com'}).status_code==403


def test_reviewed_cell_correction_and_matching_validation(client):
    created=client.post('/advanced/demo/pathology',headers=HEADERS,json={}).json();job=wait_job(client,created['id'])
    payload={'version':0,'reviewer':'Tesztelő','confirmed':True,'cells':{'1':'excluded','2':'positive'}}
    saved=client.post('/advanced/jobs/'+job['id']+'/review',headers=HEADERS,json=payload)
    assert saved.status_code==200,saved.text
    assert saved.json()['review']['counts']['excluded']==1
    created=client.post('/advanced/demo/longitudinal',headers=HEADERS,json={}).json();job=wait_job(client,created['id'])
    payload={'version':0,'reviewer':'Tesztelő','confirmed':True,'matching':[[{'baselineLabel':1,'followupLabel':1},{'baselineLabel':2,'followupLabel':1}]]}
    assert client.post('/advanced/jobs/'+job['id']+'/review',headers=HEADERS,json=payload).status_code==400
    payload['matching']=[v['matching'] for v in job['report']['visits']]
    assert client.post('/advanced/jobs/'+job['id']+'/review',headers=HEADERS,json=payload).status_code==200


def test_upload_validation_and_restart_marks_interrupted(client):
    assert client.post('/advanced/jobs/body',headers=HEADERS,data={'options':'{}'}).status_code==400
    assert client.post('/advanced/jobs/body',headers=HEADERS,data={'options':json.dumps({'researchConfirmed':True})},files={'ct':('image.jpg',b'fake')}).status_code==400
    with advanced_api.db() as conn:
        conn.execute("INSERT INTO jobs(id,kind,status) VALUES('interrupted-test','body','running')");conn.commit()
    advanced_api.initialized=False
    assert client.get('/advanced/jobs/interrupted-test').json()['status']=='interrupted'


def test_preview_and_job_cancellation(client,tmp_path,monkeypatch):
    paths,_=make_demo('pathology',tmp_path/'preview')
    response=client.post('/advanced/slide-preview',headers=HEADERS,data={'researchConfirmed':'true'},files={'slide':('slide.png',paths['slide'].read_bytes())})
    assert response.status_code==200,response.text
    assert response.json()['width']==512 and response.json()['height']==384
    def wait_cancel(kind,paths,options,out,progress,cancel):
        if cancel.wait(4):raise Cancelled()
        pytest.fail('Cancellation not delivered')
    monkeypatch.setattr(advanced_api,'run',wait_cancel)
    ids=[]
    for _ in range(3):
        r=client.post('/advanced/demo/pathology',headers=HEADERS,json={});assert r.status_code==202
        ids.append(r.json()['id'])
    assert client.post('/advanced/demo/pathology',headers=HEADERS,json={}).status_code==409
    for job_id in ids:assert client.post('/advanced/jobs/'+job_id+'/cancel',headers=HEADERS,json={}).status_code==200
    for job_id in ids:assert wait_job(client,job_id)['status']=='cancelled'


def test_demo_links_only_explicit_synthetic_cases(client):
    response=client.post('/advanced/demo/pathology',json={'caseId':'demo-leletiv-02'},headers=HEADERS)
    assert response.status_code==202
    job=wait_job(client,response.json()['id'])
    assert job['status']=='completed'
    assert job['options']['caseId']=='demo-leletiv-02'
    assert job['options']['synthetic'] is True
    assert client.post('/advanced/demo/pathology',json={'caseId':'unrelated-case'},headers=HEADERS).status_code==400
