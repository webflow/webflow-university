#!/usr/bin/env node

/**
 * Utility script to display deployment information for the scripts package.
 * Shows the jsdelivr URL and other useful deployment info.
 */

import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { execSync } from 'child_process';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const rootDir = join(__dirname, '..');

// Try to get git info
function getGitInfo() {
  try {
    const branch = execSync('git rev-parse --abbrev-ref HEAD', { encoding: 'utf-8' }).trim();
    const commit = execSync('git rev-parse HEAD', { encoding: 'utf-8' }).trim();
    const shortCommit = commit.substring(0, 7);
    return { branch, commit, shortCommit };
  } catch (error) {
    return { branch: 'unknown', commit: 'unknown', shortCommit: 'unknown' };
  }
}

// Get package.json info
function getPackageInfo() {
  try {
    const packagePath = join(rootDir, 'packages/scripts/package.json');
    const packageJson = JSON.parse(readFileSync(packagePath, 'utf-8'));
    return {
      name: packageJson.name,
      version: packageJson.version,
    };
  } catch (error) {
    return { name: 'unknown', version: 'unknown' };
  }
}

// Get repository info from package.json or git
function getRepoInfo() {
  try {
    const rootPackagePath = join(rootDir, 'package.json');
    const rootPackage = JSON.parse(readFileSync(rootPackagePath, 'utf-8'));
    if (rootPackage.repository) {
      return rootPackage.repository.url || rootPackage.repository;
    }
  } catch (error) {
    // Ignore
  }

  try {
    const remoteUrl = execSync('git config --get remote.origin.url', { encoding: 'utf-8' }).trim();
    // Convert SSH to HTTPS format
    const repoMatch = remoteUrl.match(/github\.com[:/](.+?)(?:\.git)?$/);
    if (repoMatch) {
      return `https://github.com/${repoMatch[1]}`;
    }
    return remoteUrl;
  } catch (error) {
    return 'unknown';
  }
}

function main() {
  const gitInfo = getGitInfo();
  const packageInfo = getPackageInfo();
  const repoUrl = getRepoInfo();

  // Extract repo path from URL
  const repoMatch = repoUrl.match(/github\.com\/(.+?)(?:\.git)?$/);
  const repoPath = repoMatch ? repoMatch[1] : 'owner/repo';

  // Try to get latest tag
  let latestTag = 'unknown';
  try {
    const tags = execSync('git tag --sort=-version:refname', { encoding: 'utf-8' })
      .trim()
      .split('\n');
    latestTag = tags[0] || 'none';
  } catch (error) {
    // Ignore
  }

  console.log('\n📦 Scripts Package Deployment Info\n');
  console.log('Package:', packageInfo.name);
  console.log('Version:', packageInfo.version);
  console.log('Branch:', gitInfo.branch);
  console.log('Commit:', gitInfo.shortCommit);
  console.log('Latest Tag:', latestTag);
  console.log('\n📡 jsdelivr URLs:\n');

  // Semantic version URLs
  if (packageInfo.version !== 'unknown') {
    const majorVersion = packageInfo.version.split('.')[0];
    console.log(`Current version (v${packageInfo.version}):`);
    console.log(
      `  https://cdn.jsdelivr.net/gh/${repoPath}@v${packageInfo.version}/packages/scripts/dist/index.js\n`
    );

    console.log(`Latest from major version (v${majorVersion}.*):`);
    console.log(
      `  https://cdn.jsdelivr.net/gh/${repoPath}@${majorVersion}/packages/scripts/dist/index.js\n`
    );
  }

  // Latest tag
  if (latestTag !== 'none' && latestTag !== 'unknown') {
    console.log(`Latest release tag (${latestTag}):`);
    console.log(
      `  https://cdn.jsdelivr.net/gh/${repoPath}@${latestTag}/packages/scripts/dist/index.js\n`
    );
  }

  // Branch and commit URLs
  console.log(`From branch (${gitInfo.branch}):`);
  console.log(
    `  https://cdn.jsdelivr.net/gh/${repoPath}@${gitInfo.branch}/packages/scripts/dist/index.js\n`
  );

  console.log(`Specific commit (${gitInfo.shortCommit}):`);
  console.log(
    `  https://cdn.jsdelivr.net/gh/${repoPath}@${gitInfo.commit}/packages/scripts/dist/index.js\n`
  );

  // Pro scripts
  if (packageInfo.version !== 'unknown') {
    console.log('Pro scripts (same version patterns apply):');
    console.log(
      `  https://cdn.jsdelivr.net/gh/${repoPath}@v${packageInfo.version}/packages/scripts/dist/pro/index.js\n`
    );
  }

  console.log('💡 Recommended Usage in HTML:');
  if (packageInfo.version !== 'unknown') {
    const majorVersion = packageInfo.version.split('.')[0];
    console.log(`  <!-- Use major version for auto-updates within same major version -->`);
    console.log(
      `  <script defer src="https://cdn.jsdelivr.net/gh/${repoPath}@${majorVersion}/packages/scripts/dist/index.js"></script>\n`
    );
    console.log(`  <!-- Or pin to specific version -->`);
    console.log(
      `  <script defer src="https://cdn.jsdelivr.net/gh/${repoPath}@v${packageInfo.version}/packages/scripts/dist/index.js"></script>\n`
    );
  } else {
    console.log(
      `  <script defer src="https://cdn.jsdelivr.net/gh/${repoPath}@${gitInfo.branch}/packages/scripts/dist/index.js"></script>\n`
    );
  }
}

main();
