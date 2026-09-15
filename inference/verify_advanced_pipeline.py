"""Live multipart verification of all five workflows, using generated synthetic inputs."""
from pathlib import Path
import tempfile, time, json, hashlib
import httpx
from advanced_demo import make_demo

def main():
    output=[]
    with httpx.Client(base_url='http://127.0.0.1:8789',trust_env=False,timeout=60,headers={'X-Leletiv-Research':'1','Origin':'http://127.0.0.1:5173'}) as client:
        assert client.get('/advanced/capabilities').is_success
        for kind in ['longitudinal','body','pet','pathology','mri']:
            with tempfile.TemporaryDirectory(prefix='leletiv-http-check-') as folder:
                paths,options=make_demo(kind,folder)
                if kind=='mri':options['registerSequences']=True
                response=client.post('/advanced/jobs/'+kind,data={'options':json.dumps(options)},files={role:(p.name,p.read_bytes(),'application/octet-stream') for role,p in paths.items()})
                assert response.status_code==202,response.text
                job=response.json();url='/advanced/jobs/'+job['id']
                for _ in range(180):
                    job=client.get(url).json()
                    if job['status'] not in ['running','queued']:break
                    time.sleep(.5)
                assert job['status']=='completed',job.get('error')
                for artifact in job['report']['artifacts']:
                    content=client.get(url+'/artifacts/'+artifact['file']);assert content.status_code==200
                    assert hashlib.sha256(content.content).hexdigest()==artifact['sha256']
                review={'version':0,'reviewer':'Automatikus szintetikus műszaki próba','note':'Működési ellenőrzés ismert próbabemeneten; nem klinikai validálás.','confirmed':True}
                if kind=='longitudinal':review['matching']=[v['matching'] for v in job['report']['visits']]
                if kind=='pet':review['includedRegions']=[1]
                if kind=='pathology':review['cells']={'1':'excluded'}
                saved=client.post(url+'/review',json=review);assert saved.status_code==200,saved.text
                assert client.get(url).json()['version']==1
                assert len(client.get(url+'/history').json())==1
                output.append({'kind':kind,'job':job['id'],'artifacts':len(job['report']['artifacts']),'reviewVersion':1,'elapsedSeconds':job['report']['elapsedSeconds']})
                print(json.dumps(output[-1]),flush=True)
    Path('/tmp/leletiv-advanced-verification.json').write_text(json.dumps(output,indent=2))

if __name__=='__main__':main()
