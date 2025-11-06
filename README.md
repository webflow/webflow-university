# Webflow University Monorepo

A pnpm monorepo containing client-side scripts and React components for Webflow University.

## 📦 Packages

### `packages/scripts`

TypeScript code that compiles to JavaScript and is served via jsdelivr from GitHub. These scripts power UI functionality on the website.

**Usage:**

```html
<!-- Use major version (e.g., @2) for auto-updates within same major version -->
<script
  defer
  src="https://cdn.jsdelivr.net/gh/webflow/webflow-university@2/packages/scripts/dist/index.js"
></script>

<!-- Or pin to specific version (e.g., @2.1.0) -->
<script
  defer
  src="https://cdn.jsdelivr.net/gh/webflow/webflow-university@2.1.0/packages/scripts/dist/index.js"
></script>
```

### `packages/code-components`

A Vite React project for Webflow code components. These components are imported into Webflow using their CLI tool.

**Usage:**

```bash
npx webflow library share
```

## 🚀 Getting Started

### Prerequisites

- Node.js 20+
- pnpm 10.20.0+

### Installation

```bash
# Install dependencies for all packages
pnpm install
```

### Development

```bash
# Run scripts package in dev mode (with live reload)
pnpm dev:scripts

# Run code-components in dev mode
pnpm dev:components

# Build all packages
pnpm build

# Build specific package
pnpm build:scripts
pnpm build:components
```

### Linting & Type Checking

```bash
# Lint all packages
pnpm lint

# Fix linting issues
pnpm lint:fix

# Type check all packages
pnpm check

# Format code
pnpm format
```

## 📝 Version Management & Releases

This monorepo uses [Changesets](https://github.com/changesets/changesets) for semantic versioning (e.g., 1.0.0, 1.1.0, 2.0.0).

**Why semantic versioning?**

- Clear versioning scheme (major.minor.patch)
- jsdelivr supports version tags (`@2`, `@2.1.0`, `@v2.1.0`)
- Easy to pin to specific versions or allow minor/patch updates
- Industry standard

### Creating a Changeset

When you make changes that should trigger a version bump:

```bash
pnpm changeset
```

This will:

1. Ask which packages should be bumped
2. Ask what kind of change (major, minor, patch)
3. Create a changeset file in `.changeset/`

### Versioning Packages

After creating changesets, version the packages:

```bash
pnpm changeset:version
```

This will:

- Update package versions based on changesets
- Update changelogs
- Remove used changeset files

### Releasing

The release process is automated via GitHub Actions. When you merge to `main`:

1. If there are changesets, a PR will be created to version packages
2. Once merged, a GitHub release will be created
3. The scripts package will be built and artifacts uploaded

**Manual release (if needed):**

```bash
pnpm release
```

## 🔄 Workflow

### Daily Development

1. Create a feature branch
2. Make your changes
3. Run `pnpm lint` and `pnpm check` before committing
4. Create a changeset if version bump is needed: `pnpm changeset`
5. Push and create a PR

### Releasing Scripts Package

The scripts package is automatically deployed via jsdelivr when:

- Code is pushed to `main` branch
- A GitHub release is created

**To deploy a specific version:**

1. Create a changeset for the scripts package
2. Merge the version PR
3. The GitHub Action will create a release
4. Use the jsdelivr URL with the commit hash or tag

**Get deployment info:**

```bash
node scripts/deploy-info.js
```

### Working with Code Components

1. Make changes in `packages/code-components`
2. Build: `pnpm build:components`
3. Share with Webflow: `npx webflow library share`
4. The built components will be available in Webflow

## 🏗️ Project Structure

```
webflow-university/
├── packages/
│   ├── scripts/          # Client-side scripts (TypeScript → JavaScript)
│   │   ├── src/          # Source TypeScript files
│   │   ├── dist/         # Compiled JavaScript (git-ignored)
│   │   └── bin/          # Build scripts
│   └── code-components/  # React components for Webflow
│       ├── src/          # React component source
│       └── dist/         # Built components (git-ignored)
├── .github/
│   └── workflows/        # GitHub Actions workflows
├── .changeset/          # Changeset files
└── scripts/              # Utility scripts
```

## 🤖 GitHub Actions

### CI Workflow (`.github/workflows/ci.yml`)

- Runs on every PR and push to main
- Lints and type-checks all packages
- Builds all packages to ensure they compile

### Release Workflow (`.github/workflows/release.yml`)

- Runs on push to main
- Creates version PRs if changesets exist
- Publishes packages
- Creates GitHub releases
- Uploads build artifacts

### Build Scripts Workflow (`.github/workflows/build-scripts.yml`)

- Runs on changes to scripts package
- Builds and uploads scripts artifacts

## 📋 Available Scripts

### Root Level

- `pnpm build` - Build all packages
- `pnpm build:scripts` - Build scripts package only
- `pnpm build:components` - Build code-components only
- `pnpm dev:scripts` - Dev mode for scripts (with live reload)
- `pnpm dev:components` - Dev mode for code-components
- `pnpm lint` - Lint all packages
- `pnpm lint:fix` - Fix linting issues
- `pnpm check` - Type check all packages
- `pnpm format` - Format all code
- `pnpm changeset` - Create a new changeset
- `pnpm changeset:version` - Version packages based on changesets
- `pnpm release` - Version and build packages
- `pnpm clean` - Clean build artifacts
- `pnpm clean:all` - Clean everything including node_modules

### Scripts Package

- `pnpm --filter scripts dev` - Development mode
- `pnpm --filter scripts build` - Production build
- `pnpm --filter scripts lint` - Lint scripts

### Code Components Package

- `pnpm --filter code-components dev` - Development server
- `pnpm --filter code-components build` - Production build
- `pnpm --filter code-components preview` - Preview production build

## 🔗 jsdelivr URLs

The scripts package is served via jsdelivr. **The `dist/` folder is committed to git** so jsdelivr can serve the files directly from GitHub.

**Recommended URL patterns:**

**By semantic version (recommended):**

```html
<!-- Major version - auto-updates for minor/patch releases -->
<script
  defer
  src="https://cdn.jsdelivr.net/gh/OWNER/REPO@2/packages/scripts/dist/index.js"
></script>

<!-- Specific version - pinned -->
<script
  defer
  src="https://cdn.jsdelivr.net/gh/OWNER/REPO@2.1.0/packages/scripts/dist/index.js"
></script>

<!-- With 'v' prefix (also works) -->
<script
  defer
  src="https://cdn.jsdelivr.net/gh/OWNER/REPO@v2.1.0/packages/scripts/dist/index.js"
></script>
```

**Other options:**

```html
<!-- From branch (for development/testing) -->
<script
  defer
  src="https://cdn.jsdelivr.net/gh/OWNER/REPO@main/packages/scripts/dist/index.js"
></script>

<!-- Specific commit (for debugging) -->
<script
  defer
  src="https://cdn.jsdelivr.net/gh/OWNER/REPO@abc1234/packages/scripts/dist/index.js"
></script>
```

Run `node scripts/deploy-info.js` to get the exact URLs for your current setup.

## 🚀 Quick Deployment Guide

For a complete step-by-step walkthrough, see [DEPLOYMENT_WALKTHROUGH.md](./DEPLOYMENT_WALKTHROUGH.md).

**TL;DR:**

1. Make changes → `pnpm build:scripts` → `pnpm changeset` → commit → PR → merge
2. Version PR created automatically → merge it
3. Release created automatically → use jsdelivr URL with new version

## 👥 Team Workflow

### Making Changes

1. **Create a branch:**

   ```bash
   git checkout -b feature/my-feature
   ```

2. **Make your changes** in the appropriate package(s)

3. **Test locally:**

   ```bash
   pnpm build
   pnpm lint
   pnpm check
   ```

4. **Create a changeset** if needed:

   ```bash
   pnpm changeset
   ```

5. **Commit and push:**

   ```bash
   git add .
   git commit -m "feat: add new feature"
   git push origin feature/my-feature
   ```

6. **Create a PR** on GitHub

### Reviewing PRs

- CI will automatically run linting, type checking, and builds
- Review the changes
- If changesets are included, review the version bump
- Merge when ready

### After Merging

- If changesets exist, a version PR will be created automatically
- Review and merge the version PR
- GitHub Actions will create a release
- Scripts will be available via jsdelivr

## 🛠️ Troubleshooting

### Build Issues

```bash
# Clean and rebuild
pnpm clean
pnpm install
pnpm build
```

### Dependency Issues

```bash
# Clean everything and reinstall
pnpm clean:all
pnpm install
```

### Changeset Issues

If changesets aren't working:

1. Check `.changeset/config.json` exists
2. Ensure you're on the `main` branch when versioning
3. Check that changeset files are in `.changeset/` directory

## 📚 Additional Resources

- [pnpm Workspaces](https://pnpm.io/workspaces)
- [Changesets](https://github.com/changesets/changesets)
- [jsdelivr](https://www.jsdelivr.com/)
- [Webflow Code Components](https://developers.webflow.com/docs/code-components)
