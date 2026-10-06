# Investigations

Incidents and Patterns & Outliers now share one application-scoped workspace. Select an application, then open Investigations.

- Overview: correlated errors, grouped incidents, risk, and entity timelines.
- Named patterns: recurring message templates with memorable names, counts, original messages, and evidence.
- Clusters: similar messages grouped by TF-IDF / DBSCAN; run clustering to refresh results.
- Outliers: isolated messages from the last clustering run, for review.
- Evidence ledger: search, filter, group, export CSV, replay records, and suppress false positives reversibly.
- Message space: inspect the actual vector projection and nearest messages.
- Alert rules: create conditions and review matching payloads.

The selected view is in the URL so browser Back and Forward work. Previous /incidents and /analysis links redirect here. Pattern recurrence alone does not establish an incident or a root cause. External alert payloads remain previews.
