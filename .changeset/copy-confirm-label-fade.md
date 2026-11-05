---
'scripts': patch
---

Crossfade the "Copied!" label with the copy checkmark

Copy controls that show a "Copied!" label, the checklist share link and the rich text copy panels, now crossfade the label with the same scale, blur, and fade as the icon, instead of swapping the text instantly while the icon animates. The label sits in a stack as wide as its longer text, so the control no longer changes width on copy. The crossfade now runs for 200ms instead of 220ms.

Every copy control now confirms with the checklist's checkmark: the copy panels and the heading-link fallback used different checkmark SVGs, and the onboarding glance card used a hard-coded copy of a slightly different one. The glance card keeps its gray.
