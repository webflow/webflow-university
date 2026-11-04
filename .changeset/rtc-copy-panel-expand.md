---
'scripts': minor
---

Collapse preview copy panels and confirm copies with a checkmark

Preview copy panels (`rtc-copy-panel="preview"`) now start collapsed under the footer gradient. "Show more" animates the panel open to its full height over 250ms with an ease-out cubic curve, rotates the arrow 180 degrees, fades the gradient out, and changes the label to "Show less". Panels whose content already fits hide the toggle and gradient. Set `--rtc-collapsed-height` on a panel to change its collapsed height from the 16rem default.

Copy panel buttons now crossfade their copy icon to a checkmark alongside the "Copied!" label, using the same confirmation as the checklist copy-link controls.
