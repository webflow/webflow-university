---
'scripts': minor
---

Detect YouTube embed failures on lesson/video pages, show a Watch-on-YouTube fallback, and report anonymously to Zapier → Slack. Webhook URL is configured in Webflow via `window.WFU_YT_ZAPIER_WEBHOOK` (or a meta tag). Supports `?wfu_yt_force_fail=timeout|error` for QA.
