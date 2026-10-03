"""A working task service whose runtime logs stream directly to NeuroLog."""
import logging
import os
import sqlite3
import threading
import time
from pathlib import Path
from flask import Flask, g, jsonify, request, send_file
from werkzeug.exceptions import HTTPException
from live_app.log_shipper import NeuroLogHandler
from live_app.generator import LogGenerator

ROOT = Path(__file__).resolve().parents[1]


def create_app(config=None, log_handler=None):
    app = Flask(__name__)
    app.config.update(DATABASE=str(ROOT / 'data' / 'tasks.db'), MAX_CONTENT_LENGTH=16 * 1024)
    app.config.update(config or {})
    Path(app.config['DATABASE']).parent.mkdir(parents=True, exist_ok=True)
    logger = logging.Logger('task-service', logging.INFO)
    logger.addHandler(log_handler or logging.StreamHandler())
    app.extensions['event_logger'] = logger
    generator = LogGenerator(logger)
    app.extensions['generator'] = generator
    app.extensions['started'] = time.monotonic()
    app.extensions['request_count'] = 0
    app.extensions['counter_lock'] = threading.Lock()

    def db():
        if 'db' not in g:
            g.db = sqlite3.connect(app.config['DATABASE'], timeout=10)
            g.db.row_factory = sqlite3.Row
        return g.db

    @app.teardown_appcontext
    def close_db(_error):
        connection = g.pop('db', None)
        if connection:
            connection.close()

    with app.app_context():
        db().execute('CREATE TABLE IF NOT EXISTS tasks (id INTEGER PRIMARY KEY, title TEXT NOT NULL, done INTEGER DEFAULT 0)')
        db().commit()

    @app.before_request
    def begin():
        g.started = time.monotonic()

    @app.after_request
    def log_request(response):
        duration = (time.monotonic() - g.started) * 1000
        with app.extensions['counter_lock']:
            app.extensions['request_count'] += 1
        level = logging.ERROR if response.status_code >= 500 else logging.WARNING if response.status_code >= 400 else logging.INFO
        # Log path and status, never request headers, credentials, or request bodies.
        if request.method != 'GET' or request.path != '/generator':
            logger.log(level, 'HTTP %s %s status=%d duration_ms=%.2f', request.method, request.path, response.status_code, duration)
        return response

    @app.errorhandler(HTTPException)
    def http_error(error):
        return jsonify(error=error.description), error.code

    @app.errorhandler(Exception)
    def unexpected(error):
        logger.exception('Unhandled task-service error')
        return jsonify(error='Task service request failed.'), 500

    @app.get('/')
    def index():
        return send_file(Path(__file__).with_name('index.html'))

    @app.get('/health')
    def health():
        with app.extensions['counter_lock']:
            count = app.extensions['request_count']
        return jsonify(status='ok', service='task-service', uptime_seconds=round(time.monotonic() - app.extensions['started'], 1), requests=count)

    @app.route('/generator', methods=['GET', 'POST', 'DELETE'])
    def control_generator():
        if request.method == 'DELETE':
            generator.stop()
        elif request.method == 'POST':
            data = request.get_json(silent=True)
            if not isinstance(data, dict):
                return jsonify(error='Send interval and limit as a JSON object.'), 400
            interval, limit = data.get('interval', 1), data.get('limit', 100)
            if type(interval) not in (int, float) or not 0.2 <= interval <= 10:
                return jsonify(error='Interval must be between 0.2 and 10 seconds.'), 400
            if type(limit) is not int or not 1 <= limit <= 1000:
                return jsonify(error='Limit must be between 1 and 1000 entries.'), 400
            try:
                generator.start(interval, limit)
            except ValueError as error:
                return jsonify(error=str(error)), 409
        return jsonify(generator.status())

    @app.route('/tasks', methods=['GET', 'POST'])
    def tasks():
        if request.method == 'GET':
            return jsonify([dict(row) for row in db().execute('SELECT * FROM tasks ORDER BY id DESC')])
        data = request.get_json(silent=True)
        title = data.get('title') if isinstance(data, dict) else None
        if not isinstance(title, str) or not title.strip() or len(title) > 200:
            return jsonify(error='title must contain 1 to 200 characters.'), 400
        row = db().execute('INSERT INTO tasks(title) VALUES(?)', (title.strip(),))
        db().commit()
        logger.info('Task created task_id=%d', row.lastrowid)
        return jsonify(id=row.lastrowid, title=title.strip(), done=0), 201

    @app.patch('/tasks/<int:task_id>')
    def update_task(task_id):
        data = request.get_json(silent=True)
        done = data.get('done') if isinstance(data, dict) else None
        if type(done) is not bool:
            return jsonify(error='done must be true or false.'), 400
        changed = db().execute('UPDATE tasks SET done=? WHERE id=?', (int(done), task_id)).rowcount
        db().commit()
        if not changed:
            return jsonify(error='Task not found.'), 404
        logger.info('Task %s task_id=%d', 'completed' if done else 'reopened', task_id)
        return jsonify(status='updated', id=task_id, done=done)

    return app


def main():
    handler = NeuroLogHandler(
        endpoint=os.getenv('NEUROLOG_API_URL', 'http://127.0.0.1:5001/api/ingest'), source='task-service',
        spool_path=ROOT / 'data' / 'task-log-outbox.db', key_path=ROOT / 'data' / 'task-service.key',
        api_key=os.getenv('NEUROLOG_INGEST_KEY'))
    app = create_app(log_handler=handler)
    handler.start()
    stopped = threading.Event()
    logger = app.extensions['event_logger']

    def heartbeat():
        while not stopped.wait(5):
            with app.app_context():
                with sqlite3.connect(app.config['DATABASE']) as connection:
                    total, done = connection.execute('SELECT COUNT(*),COALESCE(SUM(done),0) FROM tasks').fetchone()
                with app.extensions['counter_lock']:
                    requests = app.extensions['request_count']
                logger.info('Service heartbeat uptime_seconds=%.1f requests=%d tasks=%d completed=%d queued_logs=%d',
                            time.monotonic() - app.extensions['started'], requests, total, done, handler.pending())

    threading.Thread(target=heartbeat, name='task-service-heartbeat', daemon=True).start()
    logger.info('Task service starting on http://127.0.0.1:8000')
    try:
        app.run(host='127.0.0.1', port=8000, debug=False, threaded=True)
    finally:
        stopped.set()
        app.extensions['generator'].stop()
        logger.info('Task service stopping')
        handler.close()


if __name__ == '__main__':
    main()
