---
'scripts': patch
---

Find the glance-card copy button beside the card link

The Glance Card component now places the copy button next to the card link instead of inside it, so screen readers announce the card and the copy action separately. The script targets `.cc_glance_copy-button` as a sibling of the card link, which restores the copy action and its accessible label.
