# NeuroLog interface design

Applied the ui-ux-pro-max minimal / Swiss-style guidance to the existing React application. The monitoring layout uses operational navigation and triage rather than the search result's marketing-page pattern.

The shared system uses solid surfaces, restrained blue accents, clear borders, consistent spacing, visible keyboard focus, 44px controls, and reduced-motion support. Dark, light, and system preferences persist on the device.

Overview shows received records, error/critical counts, stored outliers, reporting sources, activity per minute, and an attention queue. Every count is scoped to the displayed recent window; generated scenarios remain labeled.

Log workspace adds distinct severity, source, and origin filters, pause/resume updates, a semantic table, and a record detail panel. Source links lead to focused AI investigation. The incident inbox and notebook organize evidence alongside responses; actual AI mode remains visible.

Anomaly analysis presents analyzed counts and review candidates. Settings contains appearance, analysis, AI configuration guidance, and the Python source link. The Python source interface retains task and generator controls in a matching visual system.

Validation covers desktop/phone layouts, color schemes, filtering, detail inspection, source navigation, analysis, and the Python controls. Frontend lint/build and existing backend regression checks are required before release.
