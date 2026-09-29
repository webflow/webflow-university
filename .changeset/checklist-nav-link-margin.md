---
'scripts': patch
---

Fix the oversized gaps between "On this page" nav rows

The Designer's `.cc_course_link.cc_checklist_nav-link:last-child` rule adds a
1rem bottom margin meant for the end of the old flat list. Since 3.3.2 every
link is the only child of its `li`, so that margin landed on every row. It is
now cancelled on the links and applied once, as bottom padding on the
top-level list.
