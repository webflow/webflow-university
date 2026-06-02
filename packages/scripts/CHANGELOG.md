# scripts

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
