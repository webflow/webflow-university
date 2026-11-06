---
'scripts': minor
---

Show Nexus course recommendations on the dashboard

Pages with a `[data-nexus-recs]` section now fill it with personalized course recommendations from Nexus for the logged-in user. Courses the user is already enrolled in are left out, and the section stays hidden when there is nothing to recommend. Each card sends a Nexus `view` event the first time it is mostly on screen and a `click` event when it is followed, so Nexus can rank future recommendations.
