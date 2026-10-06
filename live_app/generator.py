"""Bounded, opt-in synthetic workload through the normal logging pipeline."""
import logging
import random
import threading


class LogGenerator:
    def __init__(self, logger):
        self.logger = logger
        self.lock = threading.Lock()
        self.stop_event = threading.Event()
        self.thread = None
        self.generated = 0
        self.interval = 1.0
        self.limit = 100

    def status(self):
        with self.lock:
            return dict(running=bool(self.thread and self.thread.is_alive()),
                        generated=self.generated, interval=self.interval, limit=self.limit)

    def start(self, interval, limit):
        with self.lock:
            if self.thread and self.thread.is_alive():
                raise ValueError('Stop the current generator before starting another run.')
            self.interval, self.limit, self.generated = interval, limit, 0
            self.stop_event.clear()
            self.thread = threading.Thread(target=self._run, daemon=True, name='random-log-generator')
            self.thread.start()

    def _run(self):
        patterns = [
            (logging.INFO, 'Request completed status=200 duration_ms=%d'),
            (logging.INFO, 'Background job completed duration_ms=%d'),
            (logging.WARNING, 'Request rate limit exceeded status=429 retry_after_seconds=%d'),
            (logging.ERROR, 'Database connection timeout duration_ms=%d'),
            (logging.ERROR, 'Upstream connection refused status=502 duration_ms=%d'),
            (logging.CRITICAL, 'Memory allocation failed available_mb=%d'),
        ]
        while not self.stop_event.is_set():
            with self.lock:
                if self.generated >= self.limit:
                    return
            # Recurring incident bursts make small runs useful for pattern analysis.
            # Every six-entry cycle includes routine activity, warnings and errors.
            cycle = [0, 3, 3, 2, 4, 4, 1, 0, 5, 0]
            level, pattern = patterns[cycle[self.generated % len(cycle)]]
            self.logger.log(level, '[GENERATED] ' + pattern, random.randint(1, 5000))
            with self.lock:
                self.generated += 1
            if self.stop_event.wait(self.interval):
                return

    def stop(self):
        self.stop_event.set()
        if self.thread:
            self.thread.join(timeout=4)
