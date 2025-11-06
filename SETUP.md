# Setup Guide

## Initial Repository Setup

### 1. Update Repository Information

Update the `repository` field in `package.json` with your actual GitHub repository URL:

```json
{
  "repository": {
    "type": "git",
    "url": "https://github.com/your-org/webflow-university.git"
  }
}
```

Or if using SSH:

```json
{
  "repository": {
    "type": "git",
    "url": "git@github.com:your-org/webflow-university.git"
  }
}
```

### 2. GitHub Repository Settings

#### Enable GitHub Actions

1. Go to repository Settings → Actions → General
2. Ensure "Allow all actions and reusable workflows" is enabled
3. Set "Workflow permissions" to "Read and write permissions"

#### Branch Protection (REQUIRED - Set this up immediately!)

1. Go to Settings → Branches
2. Add a rule for `main` branch:
   - ✅ Require a pull request before merging
   - ✅ Require approvals (1 or more)
   - ✅ Require status checks to pass (select `lint-and-typecheck` and `build`)
   - ✅ Require branches to be up to date before merging
   - ✅ Require conversation resolution before merging
   - ✅ Do not allow bypassing the above settings
   - ✅ Restrict pushes that create matching branches (prevents direct pushes)
   - ❌ Do NOT allow force pushes
   - ❌ Do NOT allow deletions

**📖 For detailed setup instructions, see [GITHUB_SETUP.md](./GITHUB_SETUP.md)**

**Why?** This prevents accidental direct pushes, ensures code is reviewed, and guarantees CI passes before merging.

### 3. First Release Setup

After your first push to `main`:

1. Create an initial changeset:

   ```bash
   pnpm changeset
   ```

   - Select `scripts` package
   - Choose version bump type
   - Write initial changelog

2. Commit and push:

   ```bash
   git add .
   git commit -m "chore: initial changeset"
   git push origin main
   ```

3. The GitHub Action will create a version PR automatically
4. Merge the version PR to trigger the first release

### 4. Verify jsdelivr URLs

After your first commit, verify the jsdelivr URL works:

```bash
node scripts/deploy-info.js
```

Test the URL in a browser or with curl:

```bash
curl https://cdn.jsdelivr.net/gh/your-org/webflow-university@main/packages/scripts/dist/index.js
```

### 5. Webflow CLI Setup (for code-components)

If not already set up:

```bash
# Install Webflow CLI globally (if needed)
npm install -g @webflow/cli

# Authenticate
npx webflow login

# Link your library
cd packages/code-components
npx webflow library share
```

## Team Onboarding

### For New Team Members

1. **Clone the repository:**

   ```bash
   git clone <repository-url>
   cd webflow-university
   ```

2. **Install dependencies:**

   ```bash
   pnpm install
   ```

3. **Verify setup:**

   ```bash
   pnpm build
   pnpm lint
   pnpm check
   ```

4. **Read the documentation:**
   - [README.md](./README.md) - Overview and workflows
   - [CONTRIBUTING.md](./CONTRIBUTING.md) - Development guidelines

5. **Test the development workflow:**

   ```bash
   # Test scripts package
   pnpm dev:scripts
   # In another terminal, test the served files

   # Test code-components
   pnpm dev:components
   ```

## Common Tasks

### Adding a New Script

1. Create file in `packages/scripts/src/`
2. Export from `packages/scripts/src/index.ts` if needed
3. Build: `pnpm build:scripts`
4. Test locally: `pnpm dev:scripts`

### Adding a New React Component

1. Create component in `packages/code-components/src/components/`
2. Export from appropriate file
3. Build: `pnpm build:components`
4. Share with Webflow: `npx webflow library share`

### Deploying Scripts

Scripts are automatically deployed via jsdelivr when:

- Code is pushed to `main`
- A GitHub release is created

To deploy manually:

1. Build: `pnpm build:scripts`
2. Commit and push to `main`
3. Use jsdelivr URL with commit hash or branch name

### Versioning

1. Make your changes
2. Create changeset: `pnpm changeset`
3. Commit and push
4. Merge PR
5. Version PR will be created automatically
6. Merge version PR to release

## Troubleshooting

### Build Fails

```bash
# Clean and rebuild
pnpm clean
pnpm install
pnpm build
```

### jsdelivr Not Updating

- jsdelivr caches files. Use a specific commit hash instead of branch name
- Or wait a few minutes for cache to clear
- Check the URL is correct: `node scripts/deploy-info.js`

### Changesets Not Working

- Ensure you're on `main` branch
- Check `.changeset/config.json` exists
- Verify changeset files are in `.changeset/` directory
- Check GitHub Actions logs for errors

### GitHub Actions Failing

- Check repository settings (Actions enabled, permissions)
- Verify `pnpm-lock.yaml` is committed
- Check workflow files for syntax errors
- Review Actions logs for specific errors

## Next Steps

1. ✅ Update repository URL in `package.json`
2. ✅ Configure GitHub repository settings
3. ✅ Create initial changeset
4. ✅ Push to GitHub
5. ✅ Verify CI/CD workflows run
6. ✅ Test jsdelivr URLs
7. ✅ Share with team
