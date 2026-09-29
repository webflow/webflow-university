# scripts

## 3.3.1

### Patch Changes

- 62ab3ec: Polish checklist section counts and heading copy icons
  - The "On this page" nav counts now read `3 / 9` (non-breaking spaces around
    the slash) in the primary text color.
  - An `h2` whose tasks all sit in `h3` subgroups no longer shows a nav count;
    its `h3` links show theirs instead. An `h2` with tasks of its own keeps its
    count, and its `h3` links show none.
  - The heading copy-link icon is half the heading's font size and vertically
    centered on the heading text. The clickable area stays 1em.
  - The sidebar progress count reads `3 / 12` the same way.
  - The heading copy-link icon hovers to the primary text color instead of blue.
  - The heading copy-link button has no left margin.
  - The heading copy-link icon shows in `--theme--t_icon-tertiary` (full opacity) when revealed, and `--theme--t_icon-primary` when hovered or focused.

## 3.3.0

### Minor Changes

- 1cd0577: Add copy-link buttons to checklist headings, fix the copy-link checkmark animation, and show progress as a count

  **Section links.** Every `h2` and `h3` in the `#rich-content` checklist body now
  ends with a small link icon sized to the heading's font. It fades in while the
  heading is hovered (and stays faintly visible on touch devices) and turns the
  primary blue (`--swatches--blue`) when the icon itself is hovered. It is a
  button, so clicking it only copies the section URL, without the checklist
  progress query, and never scrolls. The icon then crossfades to a checkmark for
  two seconds before reverting. Its icons are cloned from the sidebar copy-link
  control, so they stay Designer-owned.

  **Checkmark fix.** The sidebar copy-link button gained a "Copy link" text label,
  and the checkmark, positioned absolutely against the whole button, started
  animating in over the label instead of over the link icon. The link and check
  icons are now wrapped in their own stack on init so they overlap each other
  regardless of the button's layout, and the injected styles outrank the
  Designer's absolute positioning on `.cc_checklist_copy-icon.is-check`. The
  button's label reads "Copied!" while the checkmark shows.

  When the confirmation ends on a control that fades out once it is no longer
  hovered, the checkmark now stays until that fade finishes, so the link icon no
  longer flashes on its way out.

  **Progress count.** `[data-checklist-progress="percent"]` now reads checked out
  of total tasks (e.g. `3/12`) instead of a percentage. The progress bar is still
  sized by percentage.

  **Per-section progress.** The static "0/9 checked" status in the Checklist
  Heading component now stays live for every heading. A section runs until the
  next heading of the same or higher level, so an `h2` count includes its `h3`
  subgroups. Each `h2` link in the "On this page" nav also shows its count
  (e.g. `3/9`), right-aligned. The status is found by its "x/y checked" text, or
  by an explicit `[data-checklist-section-status]` attribute.

  **Checkbox names.** Each task checkbox now gets `aria-labelledby` pointing at
  its task title, with a unique id assigned per item (the component renders every
  task from one definition, so a static id or `for` would be duplicated). Screen
  readers previously announced an unnamed "checkbox".

  **Persistent nav scrollbar.** When the "On this page" list overflows, it now
  shows a thin, theme-colored scrollbar that stays visible (instead of macOS's
  auto-hiding overlay) in Chrome, Safari, and Edge. `scrollbar-gutter: stable`
  reserves its space so the links never shift. Firefox gets the standard
  `scrollbar-width: thin` fallback.

## 3.2.0

### Minor Changes

- a9a549f: Include nested checklist h3 headings in the On this page nav

  Checklist Heading (No Slot) can render phase subgroups as h3 under an h2. The
  sidebar nav now picks up both levels in document order, assigns ids to each, and
  adds the Designer-owned `cc_checklist_nav-link--child` combo class on h3 links
  so they indent under their parent. Checklists that only use h2 keep a flat list
  with no child class.

## 3.1.0

### Minor Changes

- 2c70456: Add checklist sidebar navigation, and confirm the copy-link action visually

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

## 3.0.0

### Major Changes

- 002bd8c: Add checklist sidebar controls: progress, shareable link, CSV and Markdown export, and clear

  Checklist pages now persist which tasks you have completed. Progress is saved
  per page and mirrored into a `checked` query param, so a URL such as
  `/resources/seo-checklist?checked=13,15,20` restores that exact state for
  whoever opens it — matching the behaviour of the accessibility checklist. A
  shared link takes precedence over locally saved progress, so opening someone
  else's link shows their checklist rather than yours.

  The sidebar drives five controls, wired by data attribute:
  - `[data-checklist-progress="bar"]` and `[data-checklist-progress="percent"]`
    render completion, with `role="progressbar"` and an `aria-valuetext` count
  - `[data-checklist-copy-url]` copies the shareable link
  - `[data-checklist-download="csv"]` exports task, impact, difficulty, status,
    details, and guide link
  - `[data-checklist-download="md"]` exports Markdown
  - `[data-checklist-clear]` clears saved progress

  Breaking changes:
  - `initDownloadChecklistMarkdown()` is no longer called by the bundle entry
    point. `initChecklist()` replaces it and owns the existing
    `[data-copy-checklist-md]` button along with the new controls. The old export
    remains for anything loading it directly, but is deprecated.
  - Markdown export now emits phase headings for checklists whose tasks come from
    rich-text components. Those pages previously exported a flat task list and
    will now be sectioned by phase.
  - Checklist pages now read and write a `checked` query param and a
    `wfu-checklist:<path>` localStorage entry, so checkbox state is no longer
    reset on load.

## 2.8.3

### Patch Changes

- 8ad88d3: Keep keyboard focus inside the active Swiftype search results overlay and make the autocomplete Return control submit its query.

## 2.8.2

### Patch Changes

- 0974866: Keep the Swiftype autocomplete suggestions flush with the search input across responsive breakpoints.

## 2.8.1

### Patch Changes

- b2443f4: Make Swiftype result icons follow the active theme, submit active suggestions from the Return key control, and prevent horizontal layout shifts while search locks page scrolling.

## 2.8.0

### Minor Changes

- 330e7dc: Keep the custom search launcher covering the page until Swiftype's native results overlay is visible, and preserve the scrollbar gutter while search is open to prevent horizontal page shifts. Enable Swiftype's native arrow-key navigation on that overlay by wiring `.st-search-keyboard-navigable`, keep the highlighted result in view while navigating, restore keyboard shortcut help beneath Popular and autocomplete Suggestions, and trap Tab on the active autocomplete input so Swiftype cannot dismiss Suggestions while leaving the launcher open.

## 2.7.0

### Minor Changes

- dd84ae7: Return non-empty search queries to Swiftype's native autocomplete and full-results experience
  while preserving the custom Popular links shown before a visitor starts typing.

## 2.6.0

### Minor Changes

- 922828f: Remove the temporary YouTube embed failure debugger and its reporting hooks. Bundle the search-modal behavior in the scripts package and restore Swiftype analytics for Enter-key searches.

## 2.5.3

### Patch Changes

- ca623e6: Slack YouTube embed alerts for blocked viewers (ad blocker, VPN, firewall, CSP) and YouTube onError, distinguished by payload `failureKind` (`viewer-blocked`, `youtube-player`, `qa-force`). Skip bingbot user agents.

## 2.5.2

### Patch Changes

- 6ee1c89: Report YouTube embed Slack alerts only for true player onError (and QA force-fail); skip ready timeouts and bot UAs that caused false positives.

## 2.5.1

### Patch Changes

- 753f801: Improve YouTube embed failure alerts: soft cause hints, Zapier CORS fix, remove on-page banner, and skip rich-text lessons whose `.cc_video` is `w-condition-invisible` / empty embed src.

## 2.5.0

### Minor Changes

- b992bd2: Detect YouTube embed failures on lesson/video pages, show a Watch-on-YouTube fallback, and report anonymously to Zapier → Slack. Webhook URL is configured in Webflow via `window.WFU_YT_ZAPIER_WEBHOOK` (or a meta tag). Supports `?wfu_yt_force_fail=timeout|error` for QA.

## 2.4.1

### Patch Changes

- 62f2ecb: Fix sidebar cookie domain on `*.webflow.io` hosts (including branch previews) so auto-collapse below 1296px works outside production.

## 2.4.0

### Minor Changes

- 8a05435: Download checklist pages as Markdown (scripts 2.4).

  When a page includes a `[data-copy-checklist-md]` button, serialize the on-page accordion checklist into Markdown and download a `.md` file named from the page slug. Improves inline link/bold spacing, strips UI helper copy from phase intros, and uses the current page URL as the Source line.

## 2.3.1

### Patch Changes

- 120719f: Patch dependency resolutions for Socket.dev SCA advisories (APPSEC-2107 / 2167 / 2199 / 2213 / 2252) by raising workspace `pnpm` overrides for `vitest`, `picomatch`, `brace-expansion`, and `postcss`, and syncing workspace `vitest` specs.

## 2.3.0

### Minor Changes

- 8fbc185: Course completion redirects with `courseSlug` and populates StampSVG from the page catalog.

  On lesson pages, `onCourseCompleted` reads `data-course-slug` and navigates to `/course-completion?courseSlug=…`. On the completion page, the hidden CMS list supplies title and thumbnail for the StampSVG island, then the scrim fades in once the stamp is ready.

## 2.2.4

### Patch Changes

- d864d30: Add a `window.onCourseCompleted` hook on course lesson pages that logs a congratulations message when a course is completed.

## 2.2.3

### Patch Changes

- d7dc5ce: Patch dependency resolutions for security advisories by adding workspace `pnpm` overrides for `ws`, `picomatch`, `esbuild`, `vite`, `vitest`, and `react-router`.

## 2.2.2

### Patch Changes

- a841413: Initialize the courses grid/list toggle from its controls so it can run on videos and learning paths pages.

## 2.2.1

### Patch Changes

- 727702b: Show a no-upcoming-sessions message on Pro template pages.

  When the flatlist has no future session dates, the template page now displays an empty-state message in the current `#time-slot` markup.

## 2.2.0

### Minor Changes

- 8fa387b: Reduce the Pro index script to tab scrolling only.

  The Pro event listing page no longer renders date or time text from CMS schedule attributes. It now only initializes horizontal session-tab scrolling, matching the updated page markup that removed `#pro-day`, `#pro-time`, and `#pro-show-in-my-tz`.

## 2.1.0

### Minor Changes

- 5c94829: Update Pro session pages to use flatlist schedule data only.

  Pro listing and template scripts now rely on `data-datetime-flatlist` and `data-duration` for scheduling, while preserving CMS metadata attributes like `data-slug`, `data-name`, and `data-type`. Recurrence-only parsing for start, frequency, end, link, and blackout date fields has been removed from the template-page flow.

## 2.0.1

### Patch Changes

- 222fd71: Use the `data-duration` attribute when calculating Pro session time ranges, with a 60 minute fallback when no duration is provided.

## 2.0.0

### Major Changes

- ccb5fec: Update Pro session date handling to support explicit `data-datetime-flatlist` CMS values
  for listing cards and session time slots.

## 1.3.3

### Patch Changes

- 20ecd15: Remove a debug console log from the Pro session template page script.

## 1.3.2

### Patch Changes

- 375280e: Display an empty-state message on Pro session template pages when a selected time slot has no upcoming sessions.

## 1.3.1

### Patch Changes

- a8e8f36: Patch dependency resolutions for security advisories: add workspace `pnpm` overrides for `fast-uri` and `@babel/plugin-transform-modules-systemjs`, update tooling deps (including `vite` in code-components), and refresh the lockfile.

## 1.3.0

### Minor Changes

- f5a9471: Add courses page behavior for toggling and persisting the grid view, plus list-view card edge styling.

## 1.2.3

### Patch Changes

- 3f23005: Fix blackout date parsing so trailing commas and other empty comma segments are ignored instead of logging errors for otherwise valid CMS data.

  This also adds automated test coverage around blackout date parsing, recurrence/date utilities, storage, and key browser behaviors to keep these regressions easier to catch.

## 1.2.2

### Patch Changes

- b845fae: Migrate Swiftype search result icon theming into the bundled global search script.

## 1.2.1

### Patch Changes

- 610b904: Validate production build cleanup paths before deleting source maps.

## 1.2.0

### Minor Changes

- 3eed439: Add global search modal support to the main scripts bundle and clean up production source map output.

## 1.1.2

### Patch Changes

- 9f406d7: Bump locked dependency graph to remediate Socket-reported highs (minimatch, koa, rollup / related tooling). Aligns with [VULN-9964](https://webflow.atlassian.net/browse/VULN-9964). No source or runtime API changes to the shipped scripts bundle.

## 1.1.1

### Patch Changes

- 809868a: autoplay tabs styling updates
- bcadedb: Calendar styles and dev mode

## 1.1.0

### Minor Changes

- 5cbf341: Refactor sidebar, theme, and contrast functionality from JavaScript to TypeScript with modular architecture. Code is now split into separate modules (sidebar, theme, contrast) with shared utilities, while still bundling into a single file for production use.

### Patch Changes

- 5cbf341: workflow testing
