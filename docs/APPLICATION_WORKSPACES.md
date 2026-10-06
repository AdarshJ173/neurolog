# Application workspaces

The app opens on Applications. Choose a reporting source card to open its workspace. Overview, Log Explorer, Patterns & outliers, Incidents, clustering, and AI Assistant then use only that application's records. Switch app returns to the picker. Reloading requires selection again so the scope is explicit.

Source filtering happens in the backend SQL query before the recent-record limit, so a busy source cannot crowd another source out of its workspace. Clustering updates only selected-source records. Assistant history is separated per application. New alert rules are scoped to the selected source. Existing workspace-wide rules remain available to unscoped API clients; they do not appear in a selected application workspace.

Appearance preferences and ingestion-key management are workspace-wide. Connect applications shows all reporting applications so connections can be managed in one place. The task-service generator appears only in its own workspace. Guest Connect actual runtime logs remain distinct from generated task-service scenarios.

Application cards show record counts and last receipt; Recently reporting means a log arrived within two minutes, not a verified uptime check. These application scopes organize the shared demo workspace; they are not authentication or tenant isolation.
