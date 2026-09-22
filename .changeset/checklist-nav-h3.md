---
'scripts': minor
---

Include nested checklist h3 headings in the On this page nav

Checklist Heading (No Slot) can render phase subgroups as h3 under an h2. The
sidebar nav now picks up both levels in document order, assigns ids to each, and
adds the Designer-owned `cc_checklist_nav-link--child` combo class on h3 links
so they indent under their parent. Checklists that only use h2 keep a flat list
with no child class.
