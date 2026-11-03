---
'scripts': minor
---

Copy rich text copy panels as Markdown

Any element with an `rtc-copy-panel` attribute now copies its rich text to the clipboard as Markdown when its copy button is clicked. Headings, paragraphs, lists, bold, italics, and links keep their structure, so a prompt pasted into an AI chat or a Markdown editor reads the same as on the page. The button label shows "Copied!" for two seconds, and the full text is copied even when the panel is collapsed.
