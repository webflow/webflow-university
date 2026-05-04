---
"scripts": patch
---

Fix blackout date parsing so trailing commas and other empty comma segments are ignored instead of logging errors for otherwise valid CMS data.

This also adds automated test coverage around blackout date parsing, recurrence/date utilities, storage, and key browser behaviors to keep these regressions easier to catch.
