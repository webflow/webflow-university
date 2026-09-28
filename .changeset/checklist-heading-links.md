---
'scripts': minor
---

Add copy-link buttons to checklist headings, fix the copy-link checkmark animation, and show progress as a count

**Section links.** Every `h2` and `h3` in the `#rich-content` checklist body now
ends with a small link icon sized to the heading's font. It fades in while the
heading is hovered (and stays faintly visible on touch devices) and turns the
primary blue (`--swatches--blue`) when the icon itself is hovered. It is a
button, so clicking it only copies the section URL, without the checklist
progress query, and never scrolls. The icon then crossfades to a checkmark for
two seconds before reverting. Its icons are cloned from the sidebar copy-link
control, so they stay Designer-owned.

**Checkmark fix.** The sidebar copy-link button gained a "Copy link" text label,
and the checkmark, positioned absolutely against the whole button, started
animating in over the label instead of over the link icon. The link and check
icons are now wrapped in their own stack on init so they overlap each other
regardless of the button's layout, and the injected styles outrank the
Designer's absolute positioning on `.cc_checklist_copy-icon.is-check`. The
button's label reads "Copied!" while the checkmark shows.

When the confirmation ends on a control that fades out once it is no longer
hovered, the checkmark now stays until that fade finishes, so the link icon no
longer flashes on its way out.

**Progress count.** `[data-checklist-progress="percent"]` now reads checked out
of total tasks (e.g. `3/12`) instead of a percentage. The progress bar is still
sized by percentage.
