---
'scripts': patch
---

Animate checklist copy-link confirmation with a scale/blur icon swap

Clicking `[data-checklist-copy-url]` now crossfades the link icon out
(scale 0.9 + blur) while a checkmark scales and blurs in. After two
seconds the button snaps back to the link icon with no exit transition.
Requires stacked `[data-checklist-icon="link"]` and
`[data-checklist-icon="check"]` children on the control.
