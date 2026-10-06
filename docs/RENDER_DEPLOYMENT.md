# Deploy NeuroLog on Render

Deploy this repository's `codex/neurolog-fixes` branch as a Docker web service, using the root Dockerfile and the Free instance type. Leave Root Directory empty. Set health check path to `/api/health`. The container binds to Render's PORT and runs one Gunicorn worker with four threads.

The frontend is compiled during the Docker build. The dashboard and API share one origin; the Python application is mounted at `/source/`. Runtime messages are delivered internally to the API using the same ingestion validation as local operation.

Alternatively create a Render Blueprint from `render.yaml`. GROQ_API_KEY is optional: leave it unset for local evidence analysis. Add it privately in Render environment settings to enable conversational responses. Never commit the key.

This is the intentionally login-free presentation workspace. Anyone with the public URL can view hosted records, modify tasks, start bounded generation, or call workspace operations. Use only non-sensitive presentation logs. No existing local database or environment file is included in the container.

Free Render service storage is ephemeral: tasks, received logs and queue data reset on restart, redeploy or idle shutdown. A paid persistent disk or a database migration is required for durable hosted storage. The blueprint does not provision paid resources.

After deployment verify `/api/health`, `/dashboard`, `/source/`, task creation, scenario generation, received logs and AI investigation. A cold free service can take about a minute to wake up. The Render plugin must be connected to create and verify the service through this chat.

Reference: https://render.com/docs/deploy-flask and https://render.com/docs/free
