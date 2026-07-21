---
'scripts': minor
---

Course completion redirects with `courseSlug` and populates StampSVG from the page catalog.

On lesson pages, `onCourseCompleted` reads `data-course-slug` and navigates to `/course-completion?courseSlug=…`. On the completion page, the hidden CMS list supplies title and thumbnail for the StampSVG island, then the scrim fades in once the stamp is ready.
