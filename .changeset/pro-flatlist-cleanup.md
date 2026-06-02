---
"scripts": minor
---

Update Pro session pages to use flatlist schedule data only.

Pro listing and template scripts now rely on `data-datetime-flatlist` and `data-duration` for scheduling, while preserving CMS metadata attributes like `data-slug`, `data-name`, and `data-type`. Recurrence-only parsing for start, frequency, end, link, and blackout date fields has been removed from the template-page flow.
