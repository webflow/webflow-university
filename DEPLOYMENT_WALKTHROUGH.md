# Deployment Walkthrough

A complete guide to making changes to the scripts package and deploying to production.

## Step-by-Step Process

### 1. Make Your Changes

```bash
# Start from the repo root
cd /path/to/webflow-university

# Make sure you're on main and up to date
git checkout main
git pull origin main

# Create a feature branch
git checkout -b feat/add-new-feature
```

Now edit your files in `packages/scripts/src/`:

### 2. Test Locally

```bash
# Build the scripts package
pnpm build:scripts

# Or run in dev mode (with live reload)
pnpm dev:scripts
# This will serve files at http://localhost:3000
# You can test them in your browser or Webflow site
```

**Verify your changes work:**

- Check the built output in `packages/scripts/dist/`
- Test in your local environment
- Make sure there are no TypeScript errors: `pnpm check`

### 3. Lint and Format

```bash
# Check for linting issues
pnpm lint

# Auto-fix what you can
pnpm lint:fix

# Format code
pnpm format

# Type check
pnpm check
```

### 4. Create a Changeset

This tells the system what version bump is needed:

```bash
pnpm changeset
```

You'll be prompted:

1. **Which packages changed?** → Select `scripts` (use space to select, enter to confirm)
2. **What kind of change?** → Choose:
   - `major` - Breaking changes (2.0.0 → 3.0.0)
   - `minor` - New features (2.0.0 → 2.1.0)
   - `patch` - Bug fixes (2.0.0 → 2.0.1)
3. **Write a summary** → Describe what changed

This creates a file in `.changeset/` like:

```
.changeset/brave-lions-sleep.md
```

### 5. Commit and Push

```bash
# Stage your changes
git add .

# Commit with a descriptive message
git commit -m "feat: add new feature to scripts"

# Push to your branch
git push origin feat/add-new-feature
```

### 6. Create Pull Request

1. Go to GitHub and create a PR from your branch to `main`
2. Fill out the PR template
3. The CI workflow will automatically:
   - Run linting
   - Type check
   - Build all packages
4. Wait for CI to pass ✅

### 7. Review and Merge

- Get your PR reviewed
- Address any feedback
- Once approved, merge to `main`

### 8. Automatic Version PR

After merging to `main`:

1. **GitHub Actions automatically:**
   - Builds the packages
   - Commits the `dist/` folder
   - Creates a new PR called "chore: version packages"
   - This PR will:
     - Update `packages/scripts/package.json` version (e.g., 1.0.0 → 1.0.1)
     - Update CHANGELOG.md
     - Include your changeset summary

2. **Review the version PR:**
   - Check that the version bump is correct
   - Verify the changelog looks good
   - Make sure `dist/` folder changes are included

3. **Merge the version PR:**
   - This triggers the release workflow

### 9. Automatic Release

When you merge the version PR:

1. **GitHub Actions automatically:**
   - Builds the scripts package
   - Creates a git tag (e.g., `v1.0.1`)
   - Creates a GitHub Release
   - Pushes the tag to GitHub

2. **The release includes:**
   - Version number
   - jsdelivr URLs for the new version
   - Changelog summary

### 10. Deploy to Production

Your scripts are now available via jsdelivr!

**Option A: Use the new version tag**

```html
<script
  defer
  src="https://cdn.jsdelivr.net/gh/webflow/webflow-university@v1.0.1/packages/scripts/dist/index.js"
></script>
```

**Option B: Use major version (auto-updates)**
If you're already using `@1` and this was a patch/minor:

```html
<!-- This will automatically get the new version -->
<script
  defer
  src="https://cdn.jsdelivr.net/gh/webflow/webflow-university@1/packages/scripts/dist/index.js"
></script>
```

**Option C: Update your Webflow site**

1. Go to your Webflow site settings
2. Update the script tag URL to the new version
3. Publish your site

### 11. Verify Deployment

```bash
# Check deployment info
node scripts/deploy-info.js

# Or test the URL directly
curl https://cdn.jsdelivr.net/gh/webflow/webflow-university@v1.0.1/packages/scripts/dist/index.js
```

## Quick Reference

### Common Commands

```bash
# Development
pnpm dev:scripts              # Dev mode with live reload
pnpm build:scripts            # Build for production
pnpm lint                     # Check for issues
pnpm check                    # Type check

# Versioning
pnpm changeset                # Create a changeset
pnpm changeset:version        # Version packages (usually automatic)

# Deployment info
node scripts/deploy-info.js   # Show current deployment URLs
```

### Version Bump Guidelines

- **Patch (1.0.0 → 1.0.1)**: Bug fixes, small improvements
- **Minor (1.0.0 → 1.1.0)**: New features, backward compatible
- **Major (1.0.0 → 2.0.0)**: Breaking changes

### Timeline

1. **Make change** → 5-30 minutes
2. **Test locally** → 5-15 minutes
3. **Create PR** → 2 minutes
4. **CI runs** → 2-5 minutes
5. **Review & merge** → Depends on team
6. **Version PR created** → Automatic, ~2 minutes
7. **Merge version PR** → 1 minute
8. **Release created** → Automatic, ~2 minutes
9. **jsdelivr available** → Immediate (or within minutes)

**Total time:** Usually 15-30 minutes from merge to production (excluding review time)

## Troubleshooting

### CI Fails

```bash
# Fix linting issues
pnpm lint:fix

# Fix type errors
pnpm check

# Rebuild
pnpm build
```

### Version PR Not Created

- Check that you created a changeset
- Verify the changeset file exists in `.changeset/`
- Check GitHub Actions logs

### jsdelivr Not Updating

- jsdelivr caches files (usually clears within minutes)
- Use a specific version tag instead of branch name
- Check the tag exists: `git tag`

### Dist Folder Not Committed

- The workflow should handle this automatically
- If needed, manually: `git add packages/scripts/dist/ && git commit -m "chore: build"`

## Example: Complete Flow

```bash
# 1. Start
git checkout main
git pull
git checkout -b fix/calendar-bug

# 2. Make change
# Edit packages/scripts/src/index.ts

# 3. Test
pnpm build:scripts
pnpm check

# 4. Create changeset
pnpm changeset
# Select: scripts, patch, "Fix calendar date calculation bug"

# 5. Commit
git add .
git commit -m "fix: correct calendar date calculation"
git push origin fix/calendar-bug

# 6. Create PR on GitHub, wait for review

# 7. After merge, version PR is created automatically
# Review and merge it

# 8. Release is created automatically
# Your fix is now at:
# https://cdn.jsdelivr.net/gh/webflow/webflow-university@v1.0.1/packages/scripts/dist/index.js
```
