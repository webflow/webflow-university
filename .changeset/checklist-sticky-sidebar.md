---
'scripts': major
---

Add checklist sidebar controls: progress, shareable link, CSV and Markdown export, and clear

Checklist pages now persist which tasks you have completed. Progress is saved
per page and mirrored into a `checked` query param, so a URL such as
`/resources/seo-checklist?checked=13,15,20` restores that exact state for
whoever opens it — matching the behaviour of the accessibility checklist. A
shared link takes precedence over locally saved progress, so opening someone
else's link shows their checklist rather than yours.

The sidebar drives five controls, wired by data attribute:

- `[data-checklist-progress="bar"]` and `[data-checklist-progress="percent"]`
  render completion, with `role="progressbar"` and an `aria-valuetext` count
- `[data-checklist-copy-url]` copies the shareable link
- `[data-checklist-download="csv"]` exports task, impact, difficulty, status,
  details, and guide link
- `[data-checklist-download="md"]` exports Markdown
- `[data-checklist-clear]` clears saved progress

Breaking changes:

- `initDownloadChecklistMarkdown()` is no longer called by the bundle entry
  point. `initChecklist()` replaces it and owns the existing
  `[data-copy-checklist-md]` button along with the new controls. The old export
  remains for anything loading it directly, but is deprecated.
- Markdown export now emits phase headings for checklists whose tasks come from
  rich-text components. Those pages previously exported a flat task list and
  will now be sectioned by phase.
- Checklist pages now read and write a `checked` query param and a
  `wfu-checklist:<path>` localStorage entry, so checkbox state is no longer
  reset on load.
