# Reference feature comparison and implementation

Reference: `C:\Users\shahrukh\OneDrive\Desktop\SEM 5\ALP\Neurolog-AI\index.html` (single-page pipeline simulator).

The reference runs entirely in JavaScript. Its model confidence, score factors, embedding positions, worker timings, and webhook dispatches are simulated. It contains no actual HDBSCAN, XGBoost, Groq call, Kafka queue, Firebase/MongoDB write, PagerDuty request, or Slack request. Our existing live API, SQLite ingestion, durable Python sender, TF-IDF/DBSCAN, error generator, local evidence analysis, and optional Groq already implement several underlying capabilities.

## Features missing before this change

| Reference feature | Added location / behavior |
|---|---|
| Pipeline play/pause | Pipeline Lab; live workbench also pauses its refresh |
| Single-step execution | Pipeline Lab; live workbench has Refresh once |
| Flush backlog | Pipeline Lab only; simulated work is flushed without deleting live evidence |
| Reset pipeline session | Pipeline Lab only; live data stays independent |
| Playback speed presets | Pipeline Lab |
| 5× traffic surge | Pipeline Lab |
| Parallel worker / concurrency presets | Pipeline Lab; no claim of changing production worker count |
| Per-stage rail, occupancy, load and progress | Pipeline Lab |
| Queue preview and active worker chips | Pipeline Lab |
| Active trace selection | Pipeline Lab |
| Completed record replay and back-to-live | Pipeline Lab; live record replay explains stored evidence |
| Processed, backlog, active worker and latency counters | Pipeline Lab for simulated ticks; live workbench shows measured analysis milliseconds |
| Token weighting inspector | Live workbench computes TF-IDF weights; lab illustrates tokens |
| Cluster confidence animation | Pipeline Lab illustration; live clustering does not fabricate confidence |
| Global embedding / message-space map | Live TF-IDF truncated-SVD projection plus lab illustration |
| Cluster composition legend / breakdown | Pipeline Lab; live category filter and map categories |
| Nearest-neighbor inspector and links | Live cosine neighbors, record picker; lab vector-link visualization |
| Per-record 0–100 risk score | Live transparent severity + recurrence + stored outlier heuristic |
| Risk factor breakdown | Live points and reversible suppression adjustment; lab illustrative factors |
| Time-window pattern escalation | Live five-minute window, category/entity/origin grouping, threshold 3 |
| Entity watchlist | Live workbench and Pipeline Lab |
| Cross-service entity history | Live timeline using supplied entity_id; source fallback clearly labeled |
| Trace IDs in ledger | Optional validated trace_id ingested and shown; generator supplies scenario traces |
| Correlated database/network/authentication insights | Live evidence counts and sources; causation explicitly unconfirmed |
| Generated cascading failures | Pipeline Lab; no manufactured evidence in live insights |
| Grouped incident alerts / deduplication | Live incident groups, grouped ledger and rule matches |
| Raw alert vs grouped incident comparison | Live measured counts/reduction; Pipeline Lab comparative stream |
| Traditional regex/raw terminal comparison | Pipeline Lab (same synthetic stream) |
| False-positive feedback and suppression | Persisted analyst signatures; reversible, raw records preserved, no claim of model training |
| SRE / beginner / JSON explanations | Live record explanation formats and Pipeline Lab personas |
| Editable alert rules | Live database persistence plus Pipeline Lab session rules |
| Alert action destinations | In-app notifications; PagerDuty/Slack/custom webhook payload previews (reference also only simulated dispatch) |
| Alert toasts | Live deduplicated rule-match status notices; lab visual toasts |
| Grouped / raw explorer mode | Live investigation ledger and Pipeline Lab |
| Category and risk filtering | Live ledger and Pipeline Lab |
| CSV export of filtered records | Live ledger with CSV escaping/formula protection; lab export |
| Keyboard shortcuts | Workbench: Space pause, N refresh, Escape close. Lab: Space play/pause, N step, R reset |

## How to use

1. Open `/source/`, generate 26 entries at 0.2–1 second intervals. The 13-entry cycle includes repeated authentication errors as well as database/upstream errors.
2. Open `/incidents`. Inspect risk factors, grouped incidents, watchlists, and system insights.
3. Choose a map point or the accessible record picker to see real cosine neighbors and weighted terms. The 2D projection is lossy and is not a calibrated similarity score.
4. Open an entity to see its cross-service history. External senders can supply `entity_id` and `trace_id` in `/api/ingest` JSON, or Python logging `extra` fields.
5. Use the risk/category filters and Grouped view toggle. Export CSV exports every matching raw record, even in grouped view.
6. Replay a record, switch explanation formats, and optionally mark its signature as a false positive. Restore signature reverses this preference.
7. Add an alert rule. In-app matches show notifications. External destination choices expose JSON payload previews and do not send messages or require secrets.
8. Open `/pipeline` for the imported reference lab; click Play to start. It starts paused and is isolated from live storage.

All live analysis is bounded to the latest 300 records; message vectors use the latest 150. Groq remains optional in the existing AI investigation. No trained XGBoost model or external incident integration is implied. Database migrations preserve existing logs. Free Render storage still resets on restart/redeploy.
