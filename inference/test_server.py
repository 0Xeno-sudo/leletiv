from fastapi.testclient import TestClient
from server import app
import server
import time
from engine import Cancelled

client = TestClient(app, base_url='http://127.0.0.1:8789')


def test_rejects_other_websites_and_hosts():
    assert client.get('/health', headers={'Origin': 'https://example.com'}).status_code == 403
    assert client.get('/health', headers={'Host': 'evil.example:8789'}).status_code == 403


def test_requires_explicit_research_header():
    assert client.post('/smoke').status_code == 403


def test_health_and_cors():
    response = client.get('/health', headers={'Origin': 'http://127.0.0.1:5173'})
    assert response.status_code == 200
    assert response.json()['researchOnly'] is True
    assert response.headers['access-control-allow-origin'] == 'http://127.0.0.1:5173'
    assert response.headers['cache-control'] == 'no-store'
    assert client.get('/jobs').json() == []


def test_upload_rejects_unbounded_body():
    response = client.post('/jobs', headers={'X-NeuroFlow-Research': '1', 'Content-Length': str(261 * 1024 * 1024)})
    assert response.status_code == 413


def test_unknown_result_and_missing_sequences():
    assert client.get('/jobs/not-a-job').status_code == 404
    response = client.post('/jobs', headers={'X-NeuroFlow-Research': '1'}, data={'prepared': 'yes'})
    assert response.status_code in (400, 503)


def test_single_job_cancellation_and_cleanup(monkeypatch):
    def wait_for_cancel(paths, directory, progress, cancel, profile):
        progress(20, 'Running pretrained segmentation')
        if cancel.wait(3):
            raise Cancelled()
        raise AssertionError('Cancellation was not delivered')
    monkeypatch.setattr(server.engine, 'infer', wait_for_cancel)
    response = client.post('/smoke', headers={'X-NeuroFlow-Research': '1'})
    if response.status_code == 503:
        return  # Fresh checkouts can run non-model tests before downloading weights.
    assert response.status_code == 202
    job_id = response.json()['id']
    assert client.post('/smoke', headers={'X-NeuroFlow-Research': '1'}).status_code == 409
    assert client.delete(f'/jobs/{job_id}', headers={'X-NeuroFlow-Research': '1'}).json()['status'] == 'cancelling'
    for _ in range(50):
        state = client.get(f'/jobs/{job_id}').json()
        if state['status'] == 'cancelled':
            break
        time.sleep(.01)
    assert state['status'] == 'cancelled'
    assert client.get(f'/jobs/{job_id}/mask').status_code == 409
    assert client.delete(f'/jobs/{job_id}', headers={'X-NeuroFlow-Research': '1'}).json()['status'] == 'cleared'
    assert client.get(f'/jobs/{job_id}').status_code == 404
