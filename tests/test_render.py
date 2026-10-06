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
    source.extensions['generator'].stop()
    handler.close()
