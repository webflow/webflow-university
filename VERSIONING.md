# Versioning Strategy

## Semantic Versioning

We use [Semantic Versioning](https://semver.org/) (SemVer) for the scripts package:

- **MAJOR** (2.0.0): Breaking changes
- **MINOR** (2.1.0): New features, backward compatible
- **PATCH** (2.1.1): Bug fixes, backward compatible

## Why Semantic Versioning?

1. **jsdelivr Support**: jsdelivr supports semantic version tags
   - `@2` → latest v2.x.x
   - `@2.1` → latest v2.1.x
   - `@2.1.0` → exact version

2. **Flexible Pinning**: Choose your update strategy
   - Pin to major: `@2` (auto-updates for minor/patch)
   - Pin to minor: `@2.1` (auto-updates for patches only)
   - Pin to exact: `@2.1.0` (no auto-updates)

3. **Clear Communication**: Version numbers communicate change impact

## Versioning Workflow

1. **Make changes** to the scripts package
2. **Create a changeset**: `pnpm changeset`
   - Select `scripts` package
   - Choose version bump type (major/minor/patch)
   - Write changelog entry
3. **Commit and push** → PR created
4. **Merge PR** → Version PR created automatically
5. **Merge version PR** → Release created with git tag (e.g., `v2.1.0`)

## jsdelivr URL Examples

Based on your repository structure (`webflow/webflow-university`):

```html
<!-- Recommended: Major version (auto-updates) -->
<script
  defer
  src="https://cdn.jsdelivr.net/gh/webflow/webflow-university@2/packages/scripts/dist/index.js"
></script>

<!-- Specific version (pinned) -->
<script
  defer
  src="https://cdn.jsdelivr.net/gh/webflow/webflow-university@2.1.0/packages/scripts/dist/index.js"
></script>

<!-- With 'v' prefix (also works) -->
<script
  defer
  src="https://cdn.jsdelivr.net/gh/webflow/webflow-university@v2.1.0/packages/scripts/dist/index.js"
></script>
```

## Dist Folder

**Important**: The `packages/scripts/dist/` folder is **committed to git**.

This is necessary because:

- jsdelivr serves files directly from GitHub
- The built JavaScript files need to be in the repository
- Git tags point to commits that include the built files

**Note**: Only `packages/scripts/dist/` is committed. `packages/code-components/dist/` is ignored (not needed for jsdelivr).

## Version Bump Guidelines

### Major (2.0.0 → 3.0.0)

- Breaking API changes
- Removing features
- Significant architectural changes

### Minor (2.0.0 → 2.1.0)

- New features
- New functions/utilities
- Backward compatible additions

### Patch (2.0.0 → 2.0.1)

- Bug fixes
- Performance improvements
- Documentation updates (if they affect behavior)

## Checking Current Version

```bash
# See package version
cat packages/scripts/package.json | grep version

# See all git tags
git tag

# Get deployment info with URLs
node scripts/deploy-info.js
```
