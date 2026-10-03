import importlib.util
import sqlite3
from pathlib import Path
from unittest.mock import patch
import pytest

spec = importlib.util.spec_from_file_location('neurolog_api', Path(__file__).parents[1] / 'LogIntel_engine' / 'api.py')
api = importlib.util.module_from_spec(spec)
spec.loader.exec_module(api)


@pytest.fixture
def app(tmp_path, monkeypatch):
    monkeypatch.delenv('GROQ_API_KEY', raising=False)
    return api.create_app({'TESTING': True, 'LOCAL_MODE': True, 'DATABASE': str(tmp_path / 'test.db')})


def test_ingestion_and_clustering(app):
    client = app.test_client()
    assert client.get('/api/health').json['status'] == 'ok'
    assert client.post('/api/ingest', json={'message': 'hello'}).status_code == 401
    created = client.post('/api/generate-key', json={'app_name': 'Test app'}).json
    headers = {'x-api-key': created['key']}
    for _ in range(6):
        assert client.post('/api/ingest', headers=headers, json={'message': 'Request completed successfully'}).status_code == 201
    client.post('/api/ingest', headers=headers, json={'message': 'Database connection refused', 'severity_level': 2})
    assert client.post('/api/run-ml').json['anomalies_detected'] == 1
    logs = client.get('/api/recent-logs').json
    assert logs[0]['ml_anomaly'] == 1
    assert logs[0]['severity_label'] == 'CRITICAL'
    assert '+' in logs[0]['timestamp']
    assert 'key' not in client.get('/api/get-keys').json[0]
    with sqlite3.connect(app.config['DATABASE']) as connection:
        assert created['key'] not in str(connection.execute('SELECT * FROM keys').fetchall())


@pytest.mark.parametrize('data', [None, [], {}, {'message': ''}, {'message': 42},
                                 {'message': 'test', 'severity_level': True},
                                 {'message': 'test', 'severity_level': 9},
                                 {'message': 'test', 'source': []}])
def test_invalid_payloads(app, data):
    client = app.test_client()
    key = client.post('/api/generate-key', json={}).json['key']
    assert client.post('/api/ingest', json=data, headers={'x-api-key': key}).status_code == 400


def test_retention_purge_and_persistence(app):
    client = app.test_client()
    key = client.post('/api/generate-key', json={}).json['key']
    for index in range(9):
        client.post('/api/ingest', json={'message': f'Received request {index}'}, headers={'x-api-key': key})
    assert client.post('/api/settings', json={'retention': 3}).json['retention'] == 3
    with sqlite3.connect(app.config['DATABASE']) as connection:
        connection.execute("UPDATE logs SET timestamp='2000-01-01T00:00:00+00:00' WHERE _id=1")
    assert len(client.get('/api/recent-logs').json) == 8
    another = api.create_app(app.config).test_client()
    assert len(another.get('/api/recent-logs').json) == 8
    assert client.delete('/api/logs').status_code == 200
    assert client.get('/api/recent-logs').json == []


def test_ml_empty_vocabulary_and_insufficient_data(app):
    client = app.test_client()
    assert '5 logs' in client.post('/api/run-ml').json['status']
    key = client.post('/api/generate-key', json={}).json['key']
    for _ in range(5):
        client.post('/api/ingest', json={'message': 'the and a'}, headers={'x-api-key': key})
    assert 'No usable words' in client.post('/api/run-ml').json['status']


def test_chat_and_bounds(app):
    client = app.test_client()
    assert client.post('/api/chat', json={'message': ''}).status_code == 400
    assert 'Received-log summary' in client.post('/api/chat', json={'message': 'Explain logs'}).json['reply']
    assert client.get('/api/recent-logs?limit=no').status_code == 400
    assert client.get('/api/recent-logs?limit=1001').status_code == 400
    assert client.post('/api/settings', json={'retention': 99}).status_code == 400
    assert client.post('/api/chat', data='x' * 70000, content_type='application/json').status_code == 413


def test_provider_failure_falls_back_to_evidence(app, monkeypatch):
    monkeypatch.setenv('GROQ_API_KEY', 'test-only-placeholder')
    with patch('groq.Groq', side_effect=ConnectionError('provider unavailable')):
        response = app.test_client().post('/api/chat', json={'message': 'Investigate logs'})
    assert response.status_code == 200
    assert response.json['mode'] == 'local'
    assert 'unavailable' in response.json['provider_warning']


def test_production_auth_and_user_isolation(tmp_path):
    import firebase_admin
    from firebase_admin import auth
    app = api.create_app({'TESTING': True, 'LOCAL_MODE': False, 'DATABASE': str(tmp_path / 'auth.db')})
    client = app.test_client()
    assert client.get('/api/recent-logs?uid=victim').status_code == 401
    with patch.object(firebase_admin, 'get_app'), patch.object(auth, 'verify_id_token', side_effect=lambda token, **kw: {'uid': token}):
        user_a = {'Authorization': 'Bearer user-a'}
        user_b = {'Authorization': 'Bearer user-b'}
        key = client.post('/api/generate-key', json={'uid': 'user-b'}, headers=user_a).json['key']
        client.post('/api/ingest', json={'message': 'Private log'}, headers={'x-api-key': key})
        assert len(client.get('/api/recent-logs?uid=user-b', headers=user_a).json) == 1
        assert client.get('/api/recent-logs', headers=user_b).json == []
        client.delete('/api/logs', headers=user_b)
        assert len(client.get('/api/recent-logs', headers=user_a).json) == 1
    with patch.object(firebase_admin, 'get_app'), patch.object(auth, 'verify_id_token', side_effect=ValueError('bad token')):
        assert client.get('/api/recent-logs', headers={'Authorization': 'Bearer bad'}).status_code == 401
