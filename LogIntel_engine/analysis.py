"""Transparent local incident triage; log text is evidence, never executable input."""
import re
from collections import Counter

RULES = [
    ('database', ('database', 'sqlite', 'mongo', 'sql', 'deadlock', 'connection pool', 'query execution'), 'Database connectivity',
     'Check database availability, connection limits, and query latency. Verify the timeout before changing it.'),
    ('memory', ('memory', 'oom', 'allocation'), 'Memory pressure',
     'Inspect process memory and container limits. Check recent growth and large allocations before restarting.'),
    ('upstream', ('upstream', 'connection refused', '502', '503', 'gateway timeout', 'socket', 'connection reset'), 'Upstream availability',
     'Check the upstream health endpoint, address, port, and recent deployments. Review retry behavior.'),
    ('rate', ('rate limit', '429'), 'Request throttling',
     'Inspect request volume and retry-after values. Add bounded backoff and confirm the configured limit.'),
    ('auth', ('unauthorized', 'forbidden', '401', '403', 'authentication failed', 'login attempt rejected', 'token refresh failed'), 'Access rejection',
     'Verify token expiry and required permissions without printing credentials.'),
]


def normalize_message(message):
    """Ignore changing measurements/IDs so repeated events remain one pattern."""
    message = re.sub(r'^\[GENERATED\]\s*', '', message)
    message = re.sub(r'\b[0-9a-f]{8}-[0-9a-f-]{27,}\b', '<id>', message, flags=re.I)
    message = re.sub(r'\b\d+(?:\.\d+)?\b', '<n>', message)
    return message.strip()


def detect_patterns(records):
    groups = {}
    for record in records:
        template = normalize_message(record['message'])
        generated = record['message'].startswith('[GENERATED]')
        key = (record['source'], generated, record['severity_label'], template)
        group = groups.setdefault(key, dict(template=template, source=record['source'],
            generated=generated, severity=record['severity_label'], count=0,
            first_seen=record['timestamp'], last_seen=record['timestamp'], evidence=[]))
        group['count'] += 1
        group['first_seen'] = min(group['first_seen'], record['timestamp'])
        group['last_seen'] = max(group['last_seen'], record['timestamp'])
        if len(group['evidence']) < 3:
            group['evidence'].append(record['_id'])
    patterns = sorted((g for g in groups.values() if g['count'] >= 2),
                      key=lambda g: g['count'], reverse=True)
    for pattern in patterns:
        rule = next((r for r in RULES if any(t in pattern['template'].lower() for t in r[1])), None)
        pattern['next_step'] = rule[3] if rule else 'Compare this repeated event with request volume and recent changes.'
        pattern['share_percent'] = round(pattern['count'] / max(len(records), 1) * 100, 1)
    return dict(records=len(records), patterns=patterns,
                repeated_records=sum(p['count'] for p in patterns),
                error_records=sum(r['severity_level'] <= 3 for r in records))


def analyze(records, question):
    focused = records
    # Explicit source selection is deterministic and avoids inventing relevance.
    match = re.search(r'\bsource[:=]\s*([\w.-]+)', question, re.I)
    if match:
        focused = [r for r in records if r['source'].lower() == match[1].lower()]
    findings = []
    groups = {}
    for record in focused:
        if record['severity_level'] > 4 and not record['ml_anomaly']:
            continue
        text = record['message'].lower()
        rule = next((rule for rule in RULES if any(term in text for term in rule[1])), None)
        title, advice = (rule[2], rule[3]) if rule else ('Unclassified warning or outlier', 'Review this message alongside request traces and service metrics. Text alone does not establish a root cause.')
        generated = record['message'].startswith('[GENERATED]')
        group = groups.setdefault((title, record['source'], generated), dict(category=title, source=record['source'], generated=generated, count=0, evidence=[], next_step=advice))
        group['count'] += 1
        if len(group['evidence']) < 3:
            group['evidence'].append(dict(id=record['_id'], timestamp=record['timestamp'], message=record['message'][:400]))
    findings = sorted(groups.values(), key=lambda item: item['count'], reverse=True)
    generated_count = sum(r['message'].startswith('[GENERATED]') for r in focused)
    summary = dict(records=len(focused), sources=len({r['source'] for r in focused}),
                   generated=generated_count, severity=dict(Counter(r['severity_label'] for r in focused)))
    lines = ['### Received-log summary',
             f"Local rule-based analysis of **{len(focused)}** records; **{generated_count}** are explicitly generated. This is not a language-model response.",
             f"Severity counts: {', '.join(f'{key}={value}' for key, value in summary['severity'].items()) or 'no records'}."]
    for item in findings[:8]:
        lines += [f"\n### {item['category']} — {item['source']} ({item['count']} records)",
                  'Generated scenario; does not establish a real outage.' if item['generated'] else 'Possible issue inferred from log wording; root cause is unconfirmed.',
                  *[f"- Evidence #{e['id']}: {e['message']}" for e in item['evidence']],
                  f"Suggested investigation: {item['next_step']}"]
    if not findings:
        lines.append('No warnings, errors, or stored ML outliers in the selected window.')
    if 'anomal' in question.lower() or 'cluster' in question.lower():
        lines.append('ML outliers are results of the last clustering run. Run clustering to refresh them; an outlier is not proof of failure.')
    patterns = detect_patterns(focused)
    for pattern in patterns['patterns'][:5]:
        lines.append(f"Repeated pattern: **{pattern['count']} occurrences** on {pattern['source']}: {pattern['template']} (evidence IDs {pattern['evidence']}).")
    lines.append('\nNo remediation commands have been executed. Use source:name to narrow the investigation.')
    return dict(reply='\n\n'.join(lines), mode='local', summary=summary, findings=findings, patterns=patterns['patterns'])
