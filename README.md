# NeuroLog AI

Live application logging with a React dashboard, Flask ingestion API, SQLite storage, and TF-IDF/DBSCAN analysis. Opens directly without login on the local machine.

## Start

Run `powershell -ExecutionPolicy Bypass -File .\start-preview.ps1` from this folder. Python 3.12 and Node.js are required. The launcher installs missing dependencies and starts three background services.

- Python task application: http://127.0.0.1:8000
- NeuroLog dashboard: http://127.0.0.1:5173/dashboard

Create a task and complete it. The application sends actual task events, request durations/status codes, and measured service heartbeats to NeuroLog. Open Log Explorer to see the `task-service` stream. The dashboard polls every two seconds; Explorer every three seconds. Run clustering to refresh ML analysis.

The sender persists events in a SQLite outbox and retries failed delivery. Optional random generation is available in the Python app, with a rate, finite limit, and Stop control. Generated messages carry [GENERATED] and are treated separately by analysis. Current received logs use `data/neurolog-live.db`; previous records remain preserved in the older database.

## Documentation

Read `docs/USER_GUIDE.md` or `output/pdf/NeuroLog_User_Guide.pdf` for architecture, integration, settings, and troubleshooting.

## Validation

Run `.venv/Scripts/python.exe -m pytest -q`. In `logintel_ui`, run `npm run lint` and `npm run build`.

Keep the login-free workspace bound to localhost. Optional Groq configuration enables conversational analysis; otherwise the assistant summarizes actual received records. Clustering flags unusual messages for review and does not prove failure or execute remediation.

Original project: https://github.com/Sai-Nitin123/Neurolog-AI. Original MIT license and contributor attribution retained.

## Incident analysis

The AI Assistant groups warnings/errors by category and source, cites record IDs, and proposes investigation steps. Enter `source:task-service` to narrow local analysis. The interface distinguishes local rule-based analysis from Groq language-model responses. Set GROQ_API_KEY in the backend environment for conversational analysis. Provider failure returns a labeled local fallback.
