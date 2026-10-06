# Connect another application to NeuroLog

Open `/integrations` in the dashboard. Name your source, create an ingestion key, and save it as `NEUROLOG_INGEST_KEY` in your server environment. The full key is shown once; the server stores its hash.

Choose Python, Node.js, or cURL and copy the tailored example. Python users should download `neurolog_handler.py` into their application folder. It uses only Python standard libraries, buffers logs in a SQLite outbox, and retries delivery. Attach it to your existing Python logger and call `handler.close()` at shutdown. The queue survives restarts; it supports up to 10,000 pending records and reports when full. Delivery is at least once: a lost acknowledgment can result in duplicates.

The minimal Node.js example uses Node 18+ fetch with a timeout and reports non-success responses; it does not provide a durable queue. Any language can send JSON to the displayed `/api/ingest` endpoint with Content-Type application/json and the x-api-key header. Successful delivery returns 201.

Required: message (up to 10,000 characters). Optional: source (up to 120 characters), severity_level (integer 0–7), entity_id and trace_id (up to 120 characters). Timestamp is assigned on receipt. Levels: 0 emergency, 1 alert, 2 critical, 3 error, 4 warning, 5 notice, 6 info, 7 debug.

Use Send connection test to verify the endpoint and new key. Then run the example in your application and check Reporting applications and Log Explorer. The UI test alone does not verify the external application's network or runtime.

Revoke an unused key from the integrations page. Existing logs remain. The current hosted instance is a shared login-free demonstration: use non-sensitive development logs. Do not expose ingestion keys in client-side browser code or commit them to Git. Render redeployment resets keys and logs in the current ephemeral storage configuration; generate a replacement key and update the sender environment afterward.
