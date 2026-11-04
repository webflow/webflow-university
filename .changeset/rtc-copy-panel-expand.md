---
'scripts': minor
---

Collapse preview copy panels and confirm copies with a checkmark

Preview copy panels (`rtc-copy-panel="preview"`) now start collapsed, with the text fading out cleanly toward the footer. "Show more" animates the panel open to its full height over 250ms with an ease-out cubic curve, rotates the arrow 180 degrees, removes the fade, and changes the label to "Show less". Panels whose content already fits hide the toggle and fade. Set `--rtc-collapsed-height` or `--rtc-fade-height` on a panel to change the 16rem collapsed height or the 6rem fade.

Copy panel buttons now crossfade their copy icon to a checkmark alongside the "Copied!" label, using the same confirmation as the checklist copy-link controls.
