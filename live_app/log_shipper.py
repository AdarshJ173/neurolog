"""A durable, asynchronous logging.Handler for NeuroLog's ingestion API."""
from contextlib import contextmanager
import json
import logging
import os
import sqlite3
import sys
import threading
from pathlib import Path
from urllib.error import HTTPError
from urllib.parse import urlparse
from urllib.request import Request, urlopen


class NeuroLogHandler(logging.Handler):
    def __init__(self, endpoint, source, spool_path, key_path, api_key=None, transport=None):
        super().__init__()
        self.endpoint = endpoint
        self.source = source
        self.spool_path = Path(spool_path)
        self.key_path = Path(key_path)
        self.api_key = api_key
        self.explicit_key = bool(api_key)
        self.transport = transport or self._send
        self.stop_event = threading.Event()
        self.wake_event = threading.Event()
        self.spool_path.parent.mkdir(parents=True, exist_ok=True)
        with self._db() as connection:
            connection.execute('CREATE TABLE IF NOT EXISTS outbox (id INTEGER PRIMARY KEY, payload TEXT NOT NULL)')
        self.worker = None

    @contextmanager
    def _db(self):
        connection = sqlite3.connect(self.spool_path, timeout=10)
        try:
            with connection:
                yield connection
        finally:
            connection.close()

    def emit(self, record):
        if record.levelno >= logging.CRITICAL:
            severity = 2
        elif record.levelno >= logging.ERROR:
            severity = 3
        elif record.levelno >= logging.WARNING:
            severity = 4
        elif record.levelno >= logging.INFO:
            severity = 6
        else:
            severity = 7
        try:
            message = self.format(record) or "<empty log message>"
            payload = json.dumps({'source': self.source, 'severity_level': severity, 'message': message[:10000],
                'entity_id': getattr(record, 'entity_id', None), 'trace_id': getattr(record, 'trace_id', None)})
            with self._db() as connection:
                if connection.execute('SELECT COUNT(*) FROM outbox').fetchone()[0] >= 10000:
                    print('NeuroLog outbox full; latest event could not be queued.', file=sys.stderr)
                    return
                connection.execute('INSERT INTO outbox(payload) VALUES(?)', (payload,))
            self.wake_event.set()
        except Exception:
            self.handleError(record)

    def pending(self):
        with self._db() as connection:
            return connection.execute('SELECT COUNT(*) FROM outbox').fetchone()[0]

    def _request(self, url, data, headers=None):
        request = Request(url, data=json.dumps(data).encode(),
                          headers={'Content-Type': 'application/json', **(headers or {})}, method='POST')
        with urlopen(request, timeout=3) as response:
            return json.load(response)

    def _key(self):
        if self.api_key:
            return self.api_key
        if self.key_path.exists():
            self.api_key = self.key_path.read_text(encoding='utf-8').strip()
            if self.api_key:
                return self.api_key
        if urlparse(self.endpoint).hostname not in ('localhost', '127.0.0.1', '::1'):
            raise RuntimeError('Set NEUROLOG_INGEST_KEY for a remote endpoint.')
        result = self._request(self.endpoint.rsplit('/ingest', 1)[0] + '/generate-key', {'app_name': self.source})
        self.api_key = result['key']
        self.key_path.parent.mkdir(parents=True, exist_ok=True)
        temporary = self.key_path.with_suffix('.tmp')
        temporary.write_text(self.api_key, encoding='utf-8')
        os.replace(temporary, self.key_path)
        return self.api_key

    def _send(self, payload):
        try:
            self._request(self.endpoint, payload, {'x-api-key': self._key()})
        except HTTPError as error:
            if error.code == 401 and not self.explicit_key:
                self.api_key = None
                self.key_path.unlink(missing_ok=True)
            raise

    def deliver_one(self):
        with self._db() as connection:
            row = connection.execute('SELECT id,payload FROM outbox ORDER BY id LIMIT 1').fetchone()
        if row is None:
            return False
        # Remove only after a successful response. Failures leave the event durable.
        self.transport(json.loads(row[1]))
        with self._db() as connection:
            connection.execute('DELETE FROM outbox WHERE id=?', (row[0],))
        return True

    def start(self):
        if self.worker is not None:
            return
        self.worker = threading.Thread(target=self._run, name='neurolog-log-sender', daemon=True)
        self.worker.start()

    def _run(self):
        retry_delay = 1
        while not self.stop_event.is_set():
            try:
                if self.deliver_one():
                    retry_delay = 1
                    continue
                self.wake_event.wait(1)
                self.wake_event.clear()
            except Exception as error:
                # Do not recurse through Python logging when delivery itself fails.
                print(f'NeuroLog delivery unavailable ({type(error).__name__}); retrying in {retry_delay}s.', file=sys.stderr)
                self.stop_event.wait(retry_delay)
                retry_delay = min(retry_delay * 2, 30)

    def close(self):
        self.stop_event.set()
        self.wake_event.set()
        if self.worker and self.worker is not threading.current_thread():
            self.worker.join(timeout=4)
        super().close()
