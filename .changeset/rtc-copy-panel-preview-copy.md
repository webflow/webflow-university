---
'scripts': minor
---

Copy prompts in Webflow preview mode and shorten collapsed preview panels

Copy panel buttons now copy in frames that block the async Clipboard API, such as Webflow's preview mode, by falling back to a copy command. The old fallback selected the rich text instead, which highlighted the prompt on the page. If both methods fail, the button shows "Copy failed" without selecting anything.

Collapsed preview panels now default to 8rem tall with a 4rem fade, down from 16rem and 6rem. `--rtc-collapsed-height` and `--rtc-fade-height` still override both per panel.
