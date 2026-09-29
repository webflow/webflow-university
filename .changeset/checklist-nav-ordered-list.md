---
'scripts': patch
---

Render the checklist "On this page" nav as an aligned ordered list

The nav is now an `ol`, with each `h2`'s `h3` subgroups in a nested `ol`. A
heading's leading number ("4.1.") is split into its own column, and the whole
list shares one grid through subgrid, so every `h2` title starts at the same
edge, `h3` numbers sit under the `h2` titles, and a title that wraps lines up
under its first word instead of under its number. Headings without numbers
collapse the number column. The indent that `cc_checklist_nav-link--child`
used to add is now done by the nesting, so its left padding is cancelled.
