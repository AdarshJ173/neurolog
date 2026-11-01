from werkzeug.test import Client
from werkzeug.wrappers import Response
from render_app import create_hosted_app


def test_hosted_routes_source_and_log_ingestion(tmp_path):
    dist = tmp_path / 'dist'
    dist.mkdir()
    (dist / 'index.html').write_text('<html>NeuroLog dashboard</html>')
    application, api, source, handler = create_hosted_app(tmp_path / 'logs.db', tmp_path / 'tasks.db', start_sender=False, frontend_dir=dist)
    client = Client(application, Response)
    assert client.get('/api/health').json['status'] == 'ok'
    assert client.get('/dashboard').status_code == 200
    assert client.get('/assistant').status_code == 200
    assert client.get('/api/unknown').status_code == 404
    page = client.get('/source/').text
    assert 'http://127.0.0.1:5173' not in page
    assert 'href="/dashboard"' in page
    assert client.post('/source/tasks', json={'title': 'Verify hosted routing'}).status_code == 201
    while handler.deliver_one():
        pass
    logs = client.get('/api/recent-logs').json
    assert any('Task created' in row['message'] for row in logs)
    assert client.get('/source/generator').json['running'] is False
    assert client.get('/api/scenario-generator').json['running'] is False
    assert client.post('/api/scenario-generator', json={'interval': .2, 'limit': 13}).status_code == 200
    source.extensions['generator'].thread.join(timeout=5)
    while handler.deliver_one():
        pass
    assert any(r['severity_level'] <= 3 for r in client.get('/api/recent-logs').json)
    assert client.delete('/api/scenario-generator').json['running'] is False
    source.extensions['generator'].stop()
    handler.close()


def test_hosted_source_stays_idle_until_explicit_start(tmp_path):
    import time
    application, api, source, handler = create_hosted_app(
        tmp_path / 'logs.db', tmp_path / 'tasks.db', start_sender=True)
    client = Client(application, Response)
    try:
        assert client.get('/source/').status_code == 200
        assert client.get('/source/tasks').json == []
        assert client.get('/source/health').status_code == 200
        assert client.get('/api/scenario-generator').json['generated'] == 0
        time.sleep(5.2)  # Past the former automatic heartbeat interval.
        assert client.get('/api/recent-logs').json == []
        assert handler.pending() == 0
        assert not source.extensions['generator'].status()['running']
        assert client.post('/source/generator', json={'interval': .2, 'limit': 1}).status_code == 200
        source.extensions['generator'].thread.join(timeout=2)
        deadline = time.monotonic() + 3
        while not client.get('/api/recent-logs').json and time.monotonic() < deadline:
            time.sleep(.05)
        assert any(row['message'].startswith('[GENERATED]') for row in client.get('/api/recent-logs').json)
    finally:
        source.extensions['generator'].stop()
        handler.close()
