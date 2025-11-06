# Contributing Guide

## Development Workflow

### 1. Setup

```bash
# Clone the repository
git clone <repository-url>
cd webflow-university

# Install dependencies
pnpm install
```

### 2. Making Changes

#### For Scripts Package

1. Navigate to `packages/scripts/src/`
2. Make your TypeScript changes
3. Test locally:
   ```bash
   pnpm dev:scripts
   ```
4. Build for production:
   ```bash
   pnpm build:scripts
   ```

#### For Code Components Package

1. Navigate to `packages/code-components/src/`
2. Make your React component changes
3. Test locally:
   ```bash
   pnpm dev:components
   ```
4. Build for Webflow:
   ```bash
   pnpm build:components
   npx webflow library share
   ```

### 3. Before Committing

Always run these checks:

```bash
# Lint your code
pnpm lint

# Fix auto-fixable issues
pnpm lint:fix

# Type check
pnpm check

# Format code
pnpm format

# Build everything to ensure it compiles
pnpm build
```

### 4. Creating a Changeset

If your changes require a version bump:

```bash
pnpm changeset
```

Follow the prompts:

- Select which packages changed
- Choose the type of change (major/minor/patch)
- Write a summary of changes

### 5. Committing

```bash
git add .
git commit -m "feat: description of your change"
```

**Commit Message Guidelines:**

- Use conventional commits: `feat:`, `fix:`, `docs:`, `chore:`, etc.
- Be descriptive but concise
- Reference issues if applicable: `fix: resolve issue #123`

### 6. Pushing and Creating PR

```bash
git push origin your-branch-name
```

Then create a Pull Request on GitHub.

## Code Style

- Use TypeScript for all new code
- Follow existing code patterns
- Use meaningful variable and function names
- Add comments for complex logic
- Keep functions focused and small

## Testing

Before submitting a PR, ensure:

- [ ] Code lints without errors
- [ ] TypeScript compiles without errors
- [ ] All packages build successfully
- [ ] Changeset created if version bump needed
- [ ] Tested locally in development mode

## Release Process

1. Create changesets for your changes
2. Open a PR
3. After review and merge, a version PR will be created automatically
4. Merge the version PR to trigger release
5. GitHub Actions will create a release and deploy

## Questions?

If you have questions, please open an issue or reach out to the team.
