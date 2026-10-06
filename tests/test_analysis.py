from LogIntel_engine.analysis import analyze


def record(id, message, source='app', level=3):
    return dict(_id=id, message=message, source=source, severity_level=level,
                severity_label='ERROR', ml_anomaly=0, timestamp='2026-10-03T00:00:00Z')


def test_generated_incidents_are_separate_from_real_evidence():
    result = analyze([record(1, 'Database connection timeout'),
                      record(2, '[GENERATED] Database connection timeout')], 'Investigate errors')
    assert result['summary']['generated'] == 1
    assert len(result['findings']) == 2
    assert 'does not establish a real outage' in result['reply']
    assert '#1' in result['reply']
    assert 'connection limits' in result['reply']


def test_source_filter_and_empty_window():
    records = [record(1, 'Memory allocation failed', 'worker'), record(2, 'Upstream connection refused', 'web')]
    result = analyze(records, 'Investigate source:worker')
    assert result['summary']['records'] == 1
    assert result['findings'][0]['category'] == 'Memory pressure'
    assert analyze(records, 'source:unknown')['summary']['records'] == 0
from LogIntel_engine.analysis import detect_patterns, normalize_message


def test_patterns_ignore_measurements_but_separate_origin_and_source():
    records = [record(1, 'Database connection timeout duration_ms=100'),
               record(2, 'Database connection timeout duration_ms=900'),
               record(3, '[GENERATED] Database connection timeout duration_ms=20'),
               record(4, 'Database connection timeout duration_ms=30', 'other')]
    result = detect_patterns(records)
    assert len(result['patterns']) == 1
    assert result['patterns'][0]['count'] == 2
    assert result['patterns'][0]['evidence'] == [1, 2]
    assert result['error_records'] == 4
    assert normalize_message('HTTP status=200 duration_ms=0.51') == 'HTTP status=<n> duration_ms=<n>'


def test_small_generator_run_has_repeated_errors():
    from live_app.generator import LogGenerator
    import logging
    class Capture:
        def __init__(self): self.entries = []
        def log(self, level, template, value): self.entries.append((level, template % value))
    capture = Capture()
    generator = LogGenerator(capture)
    generator.start(0.001, 6)
    generator.thread.join(timeout=2)
    assert len(capture.entries) == 6
    errors = [message for level, message in capture.entries if level >= logging.ERROR]
    assert len(errors) == 4
    assert all(message.startswith('[GENERATED]') for message in errors)
