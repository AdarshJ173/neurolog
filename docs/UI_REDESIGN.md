# NeuroLog interface redesign

The chosen direction is a compact operational workspace: quiet neutral surfaces, cobalt actions, readable evidence, and one consistent navigation structure. Light and dark themes use the same hierarchy. Semantic green, amber, and red remain reserved for status.

## Design comparison

All 69 supplied Stageshow examples were rendered into timed contact sheets in the local, ignored `tmp/stageshow-lab` directory. This includes the gold layouts, product studies, and specimen catalogs. The sheets were compared by composition and motion family; this was not exhaustive frame-by-frame certification of every example.

| Family | Decision for this application |
| --- | --- |
| Structured lists and panels | Selected: makes records, runs, and evidence easy to scan. |
| Dark hero surface hierarchy | Selected: separate canvas, panel, and raised controls without glow. |
| Loading skeletons and staggered arrivals | Selected in restrained form, triggered by actual loading or navigation. |
| Detail panels and progressive disclosure | Selected: evidence and connection controls open on demand. |
| Overlapping windows, tilted stacks, and bento compositions | Useful marketing studies; unsuitable for the primary evidence workflow. |
| Cursor walkthroughs, drag gestures, and phone-specific morphs | Reviewed as interaction studies; no simulated activity added to live application screens. |
| Glass, decorative grounds, and strong continuous motion | Omitted to keep log reading calm and legible. |

A separate workflow-history study started from Stageshow's `dark-hero`, retaining its list reveal and status transition. It was adapted for desktop and a 390px viewport, with a reduced-motion result poster. The compact and desktop films reported the rehearsal gate passed, but timing coverage remained inconclusive because of sampling gaps. A small badge optical-inset advisory remains in that study. The final reduced-motion still passed without detected issues. The study is a design experiment, not a shipped production component.

## Implemented behavior

- Shared sidebar, workspace selector, breadcrumb, theme control, and search.
- Application cards adapt to the number of applications and available width.
- Overview contains three metrics, an activity chart, stream details, and recent errors. Recurring patterns live only in Investigations.
- Investigations has four primary destinations; pattern and evidence variants use one selector instead of seven simultaneous tabs. Pattern details expand from compact rows.
- Log Explorer puts level, source, and origin filters in one toolbar. Severity uses a small dot and label instead of a filled badge.
- GitHub uses one repository toolbar, separate runs/imports views, six runs per page, and one aligned outcome tag per run. Evidence and saved findings open in side panels. Connection credentials also open in a side panel.
- Connection setup shows one of three steps at a time; key management opens separately. Settings displays one category at a time. Assistant evidence stays collapsed until requested.
- Removed duplicate navigation cards, repeated source summaries, the global analysis action, decorative footer, and development tools from Overview.
- Small page arrivals, card stagger, panel opening, and loading feedback. Charts do not replay animation on each polling update.
- Reduced-motion CSS removes transitions and animations. Existing native dialogs retain keyboard dismissal and focus behavior.

## Validation

Backend suite: 76 tests passed, including import limits, redaction, ownership, deduplication, and resolution evidence. Frontend lint and production build passed. Live public GitHub connection/run discovery was checked; real log archive download required a token. Import and summary UI were checked against an isolated fixture, not represented as real repository imports.

Browser checks covered light/dark appearance, 390px layout, application selection, log search, pausing, record inspection, Escape dismissal, mobile navigation, and the overview. The restructured version was also checked for workflow pagination, the status-evidence drawer, saved-import findings and status refresh in an isolated fixture, single-category settings, and connection-setup navigation. The loaded mobile workflow list had no horizontal overflow. Final screenshots are `github-restructured-final.png` and `neurolog-restructured-final.png`. No remote publishing was performed.
