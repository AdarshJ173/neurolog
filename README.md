# NeuroLog AI demo

A presentation-ready local demo with no login, account setup, or API-key configuration in the interface.

## Start the demo

Requires Node.js 22.12+ and Python 3.12. From the project root on Windows:

```powershell
powershell -ExecutionPolicy Bypass -File .\start-preview.ps1
```

The launcher installs missing dependencies, starts Flask and Vite as hidden background processes, checks the API, and loads sample records if the database is empty. Both services stay running after the launcher exits.

Open **http://127.0.0.1:5173/dashboard**. Click **Run clustering**, then explore Vector Analysis, Log Explorer, and AI Assistant. Demo Settings contains only appearance and sample-data controls.

To run the services in visible terminals instead:

```powershell
$env:NEUROLOG_DEMO='true'
.\.venv\Scripts\python.exe LogIntel_engine\api.py
```

In another terminal, run `npm run dev` inside `logintel_ui`. Keep those terminals open.

## Guide and preview

- [Demo guide](docs/USER_GUIDE.md)
- [Printable PDF](output/pdf/NeuroLog_User_Guide.pdf)
- [Repair notes](docs/REPAIR_NOTES.md)

![Demo preview](docs/preview.png)

The frontend has no Firebase dependency or authentication routes. The demo runs locally with React, Flask, SQLite, and TF-IDF/DBSCAN. The assistant uses a labeled deterministic local response when no Groq key is configured. It does not execute remediation. The health score is a recent-log heuristic; outliers are review candidates rather than proof of failure.

## Check the code

Run `.\.venv\Scripts\python.exe -m pytest -q` from the root. In `logintel_ui`, run `npm run lint` and `npm run build`. GitHub Actions also checks the optional gateway.

## Attribution

Based on [Sai-Nitin123/Neurolog-AI](https://github.com/Sai-Nitin123/Neurolog-AI), with the original MIT license retained. Original contributors: Sai Nitin, Dhruv Patel, and Manoj Kolapalli.
