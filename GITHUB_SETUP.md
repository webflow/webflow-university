# GitHub Repository Setup Guide

Complete guide for setting up your GitHub repository with proper protections and workflows.

## Initial Setup (Before First Push)

### 1. Create Repository on GitHub

1. Go to GitHub and create a new repository
2. Name it: `webflow-university` (or your preferred name)
3. **Don't initialize with README, .gitignore, or license** (you already have these)
4. Copy the repository URL

### 2. Update Repository URL in package.json

```bash
# Edit package.json and add repository field
```

Update `package.json`:

```json
{
  "name": "webflow-university",
  "repository": {
    "type": "git",
    "url": "https://github.com/your-org/webflow-university.git"
  },
  ...
}
```

### 3. Push Your Code

```bash
# Initialize git if not already done
git init

# Add remote
git remote add origin https://github.com/your-org/webflow-university.git

# Add all files
git add .

# Commit
git commit -m "chore: initial commit"

# Push to main
git branch -M main
git push -u origin main
```

## Branch Protection Rules (IMPORTANT)

**Set these up immediately after your first push!**

### Access Branch Protection

1. Go to your repository on GitHub
2. Click **Settings** → **Branches**
3. Under "Branch protection rules", click **Add rule**
4. In "Branch name pattern", enter: `main`

### Recommended Protection Rules

#### ✅ Required Settings

**1. Require a pull request before merging**

- ✅ Check: "Require a pull request before merging"
- ✅ Check: "Require approvals" → Set to `1` (or more for your team)
- ✅ Check: "Dismiss stale pull request approvals when new commits are pushed"
- ✅ Check: "Require review from Code Owners" (if you set up CODEOWNERS)

**2. Require status checks to pass before merging**

- ✅ Check: "Require status checks to pass before merging"
- ✅ Check: "Require branches to be up to date before merging"
- ✅ Select these required checks:
  - `lint-and-typecheck` (from CI workflow)
  - `build` (from CI workflow)

**3. Require conversation resolution before merging**

- ✅ Check: "Require conversation resolution before merging"

**4. Do not allow bypassing the above settings**

- ✅ Check: "Do not allow bypassing the above settings"
- ⚠️ **Important**: Uncheck "Allow specified actors to bypass required pull requests" unless you have a specific need

#### ⚠️ Optional but Recommended

**5. Restrict who can push to matching branches**

- ✅ Check: "Restrict pushes that create matching branches"
- This prevents anyone from pushing directly to `main` (even admins)

**6. Allow force pushes**

- ❌ **Uncheck**: "Allow force pushes" (default is unchecked, which is good)

**7. Allow deletions**

- ❌ **Uncheck**: "Allow deletions" (default is unchecked, which is good)

### Summary of Protection Rules

Your `main` branch should have:

- ✅ Require PR before merging
- ✅ Require 1+ approval
- ✅ Require CI checks to pass (`lint-and-typecheck`, `build`)
- ✅ Require branches to be up to date
- ✅ Require conversation resolution
- ✅ No bypassing allowed
- ✅ No direct pushes (restrict pushes)
- ❌ No force pushes
- ❌ No deletions

## GitHub Actions Settings

### Enable GitHub Actions

1. Go to **Settings** → **Actions** → **General**
2. Under "Workflow permissions":
   - Select: **"Read and write permissions"**
   - ✅ Check: "Allow GitHub Actions to create and approve pull requests"
3. Click **Save**

### Why These Settings Matter

- **Read and write permissions**: Needed for the release workflow to:
  - Create git tags
  - Create GitHub releases
  - Push commits (for version PRs)
  - Commit the `dist/` folder

## CODEOWNERS File (Optional but Recommended)

Create `.github/CODEOWNERS` to automatically request reviews:

```
# Require review for all changes
* @your-github-username

# Or require review from team
* @your-org/team-name
```

This ensures PRs automatically get assigned reviewers.

## Testing Your Setup

### 1. Test Branch Protection

Try to push directly to main (should fail):

```bash
git checkout main
# Make a small change
echo "# test" >> TEST.md
git add TEST.md
git commit -m "test: direct push"
git push origin main
# Should be rejected!
```

### 2. Test PR Workflow

```bash
# Create a test branch
git checkout -b test/branch-protection
echo "# test" >> TEST.md
git add TEST.md
git commit -m "test: branch protection"
git push origin test/branch-protection

# Create PR on GitHub
# Verify:
# - CI runs automatically
# - You can't merge without approval (if you're the only reviewer)
# - You can't merge if CI fails
```

### 3. Test Changesets Workflow

```bash
# Create a changeset
pnpm changeset
# Select scripts, patch, write summary

git add .
git commit -m "test: changeset"
git push origin test/branch-protection

# After merging PR:
# - Version PR should be created automatically
# - You should need to approve it
# - After merging, release should be created
```

## Common Issues and Solutions

### Issue: "CI checks not showing up"

**Solution:**

- Make sure GitHub Actions is enabled
- Push a commit to trigger the workflow
- Check Actions tab to see if workflows are running
- Verify workflow files are in `.github/workflows/`

### Issue: "Can't merge PR - status checks pending"

**Solution:**

- Wait for CI to finish (usually 2-5 minutes)
- Check Actions tab for failed workflows
- Fix any linting/type errors
- Push a new commit to re-trigger CI

### Issue: "Release workflow failing"

**Solution:**

- Check that "Read and write permissions" is enabled in Actions settings
- Verify GITHUB_TOKEN has proper permissions
- Check Actions logs for specific errors

### Issue: "Version PR not being created"

**Solution:**

- Verify changeset file exists in `.changeset/` directory
- Check that changesets action has proper permissions
- Review Actions logs for errors

## Security Best Practices

1. **Never commit secrets** - Use GitHub Secrets for sensitive data
2. **Review all PRs** - Even your own (or use CODEOWNERS)
3. **Keep dependencies updated** - Run `pnpm update` regularly
4. **Use branch protection** - Prevents accidents
5. **Monitor Actions** - Check for unexpected workflow runs

## Team Collaboration

### For Team Members

1. **Always work in branches** - Never push directly to `main`
2. **Wait for CI** - Don't merge until CI passes
3. **Create changesets** - For any scripts package changes
4. **Review version PRs** - Check version bumps are correct

### For Admins

1. **Don't bypass protections** - Even if you can
2. **Review all PRs** - Especially version PRs
3. **Monitor releases** - Verify tags and releases are created correctly
4. **Keep workflows updated** - Review and update GitHub Actions as needed

## Next Steps After Setup

1. ✅ Push your code to GitHub
2. ✅ Set up branch protection (this guide)
3. ✅ Enable GitHub Actions
4. ✅ Create first changeset
5. ✅ Test the full workflow with a small change
6. ✅ Verify releases are created correctly

## Quick Checklist

Before your first real deployment:

- [ ] Repository created on GitHub
- [ ] Code pushed to `main`
- [ ] Branch protection rules configured
- [ ] GitHub Actions enabled with write permissions
- [ ] CI workflow runs successfully
- [ ] Test PR workflow works
- [ ] Test changeset workflow works
- [ ] CODEOWNERS file created (optional)
- [ ] Team members added as collaborators
- [ ] Repository URL in `package.json` updated
