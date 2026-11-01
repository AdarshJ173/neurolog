# NeuroLog interface redesign

The chosen direction is a compact operational workspace: quiet neutral surfaces, cobalt actions, readable evidence, and one consistent navigation structure. Light and dark themes use the same hierarchy. Semantic green, amber, and red remain reserved for status.

## Design comparison

All 69 supplied Stageshow examples were rendered into timed contact sheets in the local, ignored `tmp/stageshow-lab` directory. This includes the gold layouts, product studies, and specimen catalogs. The sheets were compared by composition and motion family; this was not exhaustive frame-by-frame certification of every example.

| Family | Decision for this application |
| --- | --- |
| Structured lists and panels | Selected: makes records, runs, and evidence easy to scan. |
| Dark hero surface hierarchy | Selected: separate canvas, panel, and raised controls without glow. |
| Loading skeletons and staggered arrivals | Selected in restrained form, triggered by actual loading or navigation. |
| Detail panels and progressive disclosure | Selected: evidence opens on demand; development scenarios stay collapsed. |
| Overlapping windows, tilted stacks, and bento compositions | Useful marketing studies; unsuitable for the primary evidence workflow. |
| Cursor walkthroughs, drag gestures, and phone-specific morphs | Reviewed as interaction studies; no simulated activity added to live application screens. |
| Glass, decorative grounds, and strong continuous motion | Omitted to keep log reading calm and legible. |

A separate workflow-history study started from Stageshow's `dark-hero`, retaining its list reveal and status transition. It was adapted for desktop and a 390px viewport, with a reduced-motion result poster. The compact and desktop films reported the rehearsal gate passed, but timing coverage remained inconclusive because of sampling gaps. A small badge optical-inset advisory remains in that study. The final reduced-motion still passed without detected issues. The study is a design experiment, not a shipped production component.

## Implemented behavior

- Shared sidebar, workspace selector, breadcrumb, theme control, and search.
- Application cards adapt to the number of applications and available width.
- Overview prioritizes current activity, records, errors, and recurring patterns.
- Consistent tables, filters, detail panels, assistant, settings, and connection forms.
- GitHub runs and findings expose later-commit status, evidence, and check time.
- Small page arrivals, card stagger, panel opening, and loading feedback. Charts do not replay animation on each polling update.
- Reduced-motion CSS removes transitions and animations. Existing native dialogs retain keyboard dismissal and focus behavior.

## Validation

Backend suite: 76 tests passed, including import limits, redaction, ownership, deduplication, and resolution evidence. Frontend lint and production build passed. Live public GitHub connection/run discovery was checked; real log archive download required a token. Import and summary UI were checked against an isolated fixture, not represented as real repository imports.

Browser checks covered light/dark appearance, 390px layout, application selection, log search, pausing, record inspection, Escape dismissal, mobile navigation, and the overview. Additional review screenshots are saved beside this document. No remote publishing was performed.
