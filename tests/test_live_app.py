import logging
import time
from live_app.app import create_app
from live_app.log_shipper import NeuroLogHandler


def make_handler(tmp_path, transport):
    return NeuroLogHandler('http://127.0.0.1:5001/api/ingest', 'task-service',
                           tmp_path / 'outbox.db', tmp_path / 'key', transport=transport)


def test_real_task_activity_emits_logs(tmp_path):
    delivered = []
    handler = make_handler(tmp_path, delivered.append)
    app = create_app({'TESTING': True, 'DATABASE': str(tmp_path / 'tasks.db')}, handler)
    client = app.test_client()
    task = client.post('/tasks', json={'title': 'Connect runtime logs'})
    assert task.status_code == 201
    task_id = task.json['id']
    assert client.patch(f'/tasks/{task_id}', json={'done': True}).status_code == 200
    assert client.get('/tasks').json[0]['done'] == 1
    assert client.post('/tasks', json={'title': ''}).status_code == 400
    while handler.deliver_one():
        pass
    assert any('Task created' in row['message'] for row in delivered)
    assert any('Task completed' in row['message'] for row in delivered)
    assert any('status=400' in row['message'] and row['severity_level'] == 4 for row in delivered)
    assert all(row['source'] == 'task-service' for row in delivered)
    assert handler.pending() == 0
    handler.close()


def test_outage_preserves_queue_and_restart_retries(tmp_path):
    def offline(_payload):
        raise ConnectionError('offline')
    handler = make_handler(tmp_path, offline)
    handler.emit(logging.LogRecord('app', logging.ERROR, '', 0, 'Connection failed', (), None))
    try:
        handler.deliver_one()
    except ConnectionError:
        pass
    assert handler.pending() == 1
    handler.close()
    delivered = []
    restored = make_handler(tmp_path, delivered.append)
    assert restored.deliver_one()
    assert restored.pending() == 0
    assert delivered[0]['severity_level'] == 3
    restored.close()


def test_handler_can_feed_actual_neurolog_api(tmp_path):
    from tests.test_api import api
    client = api.create_app({'TESTING': True, 'LOCAL_MODE': True, 'DATABASE': str(tmp_path / 'neurolog.db')}).test_client()
    key = client.post('/api/generate-key', json={'app_name': 'task-service'}).json['key']
    def transport(payload):
        response = client.post('/api/ingest', headers={'x-api-key': key}, json=payload)
        assert response.status_code == 201
    handler = make_handler(tmp_path, transport)
    service = create_app({'TESTING': True, 'DATABASE': str(tmp_path / 'tasks.db')}, handler).test_client()
    assert service.post('/tasks', json={'title': 'Real integration'}).status_code == 201
    while handler.deliver_one():
        pass
    records = client.get('/api/recent-logs').json
    assert len(records) == 2
    assert all(row['source'] == 'task-service' for row in records)
    handler.close()


def test_invalid_updates_and_missing_tasks(tmp_path):
    delivered = []
    handler = make_handler(tmp_path, delivered.append)
    client = create_app({'TESTING': True, 'DATABASE': str(tmp_path / 'tasks.db')}, handler).test_client()
    assert client.patch('/tasks/999', json={'done': True}).status_code == 404
    assert client.patch('/tasks/999', json={'done': 'yes'}).status_code == 400
    assert client.post('/tasks', json=[]).status_code == 400
    assert client.post('/tasks', json={'title': 'x' * 201}).status_code == 400
    assert client.get('/health').json['service'] == 'task-service'
    handler.close()


def test_generator_limit_validation_and_stop(tmp_path):
    delivered = []
    handler = make_handler(tmp_path, delivered.append)
    app = create_app({'TESTING': True, 'DATABASE': str(tmp_path / 'tasks.db')}, handler)
    client = app.test_client()
    assert not client.get('/generator').json['running']
    assert client.post('/generator', json={'interval': 0, 'limit': 10}).status_code == 400
    assert client.post('/generator', json={'interval': 1, 'limit': True}).status_code == 400
    assert client.post('/generator', json={'interval': .2, 'limit': 2}).status_code == 200
    assert client.post('/generator', json={'interval': .2, 'limit': 2}).status_code == 409
    app.extensions['generator'].thread.join(timeout=3)
    assert client.get('/generator').json['generated'] == 2
    assert not client.get('/generator').json['running']
    while handler.deliver_one():
        pass
    assert len([row for row in delivered if row['message'].startswith('[GENERATED]')]) == 2
    client.post('/generator', json={'interval': 10, 'limit': 100})
    assert client.delete('/generator').status_code == 200
    count = app.extensions['generator'].generated
    time.sleep(.05)
    assert app.extensions['generator'].generated == count
    handler.close()
