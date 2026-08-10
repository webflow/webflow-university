---
'scripts': minor
---

Download checklist pages as Markdown (scripts 2.4).

When a page includes a `[data-copy-checklist-md]` button, serialize the on-page accordion checklist into Markdown and download a `.md` file named from the page slug. Improves inline link/bold spacing, strips UI helper copy from phase intros, and uses the current page URL as the Source line.

Also fix sidebar cookie domain handling on `*.webflow.io` hosts (including branch previews) so auto-collapse below 1296px works outside production.
