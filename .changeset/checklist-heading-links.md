---
'scripts': minor
---

Add copy-link icons to checklist headings, and fix the copy-link checkmark animation

**Section links.** Every `h2` and `h3` in the `#rich-content` checklist body now
ends with a small link icon. It fades in while the heading is hovered (and stays
faintly visible on touch devices). Clicking it copies the URL of that section,
without the checklist progress query, and crossfades to a checkmark for two
seconds before reverting. The control is a real `#id` anchor, so modified clicks
open the section in a new tab as usual. Its icons are cloned from the sidebar
copy-link control, so they stay Designer-owned.

**Checkmark fix.** The sidebar copy-link button gained a "Copy link" text label,
and the checkmark, positioned absolutely against the whole button, started
animating in over the label instead of over the link icon. The link and check
icons are now wrapped in their own stack on init so they overlap each other
regardless of the button's layout, and the injected styles outrank the
Designer's absolute positioning on `.cc_checklist_copy-icon.is-check`.
