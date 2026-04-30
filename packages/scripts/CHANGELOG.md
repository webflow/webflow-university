# scripts

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
