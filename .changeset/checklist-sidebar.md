---
'scripts': minor
---

Add checklist sidebar navigation, and confirm the copy-link action visually

Two additions to the checklist sidebar.

**Section navigation.** Checklist pages now get an "On this page" list built from
every `h2` inside the `#rich-content` rich text block. Long checklists are a lot
of scrolling, and the phase headings were the one piece of structure a reader had
no way to jump between.

Because the checklist body is a CMS rich text field, its headings arrive without
ids and there is nothing for a link to point at. `initChecklistNav()` builds both
halves of the anchor: it slugifies each heading's text onto the heading as an id
(keeping any id a CMS author set by hand, and numbering duplicates so two phases
called "Extras" stay distinct), then clones the `[data-checklist-nav-item]` link
authored in the Designer once per heading. Keeping the link as a Designer-owned
template rather than markup built in code means the styling stays editable in
Webflow and does not need a release to change.

Wiring:

- `[data-checklist-nav]` is the container the links are rendered into, and must
  contain one `[data-checklist-nav-item]` anchor to clone
- `[data-checklist-nav-section]` marks the parts to hide when a checklist has no
  `h2` at all, so the sidebar does not show an empty panel

The navigation is driven by headings rather than tasks, so it initializes before
task discovery and works on a page where no tasks are found.

**Copy-link confirmation.** Clicking `[data-checklist-copy-url]` now crossfades
the link icon out, scaling it down and blurring it, while a checkmark scales and
blurs in. After two seconds the button returns to the link icon with no exit
transition, so the reset reads as instant rather than as a second animation.

This requires stacked `[data-checklist-icon="link"]` and
`[data-checklist-icon="check"]` children on the control. The resting styles that
hide the checkmark are injected on init rather than on first click, otherwise
both icons render side by side until the button is used.
