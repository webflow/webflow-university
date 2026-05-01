import process from 'node:process';

import * as esbuild from 'esbuild';
import { readdirSync, rmSync } from 'fs';
import { isAbsolute, join, relative, resolve, sep } from 'path';

// Config output
const BUILD_DIRECTORY = 'dist';
const BUILD_DIRECTORY_PATH = resolve(BUILD_DIRECTORY);
const PRODUCTION = process.env.NODE_ENV === 'production';

// Config entrypoint files
const ENTRY_POINTS = ['src/index.ts', 'src/pro/index.ts', 'src/pro/template-page.ts'];

// Config dev serving
const LIVE_RELOAD = !PRODUCTION;
const SERVE_PORT = 3000;
const SERVE_ORIGIN = `http://localhost:${SERVE_PORT}`;

// Create context
const buildOptions = {
  bundle: true,
  entryPoints: ENTRY_POINTS,
  outdir: BUILD_DIRECTORY,
  minify: PRODUCTION,
  sourcemap: !PRODUCTION,
  target: PRODUCTION ? 'es2020' : 'esnext',
  define: {
    SERVE_ORIGIN: JSON.stringify(SERVE_ORIGIN),
  },
};

// Only inject live-reload in development
if (LIVE_RELOAD) {
  buildOptions.inject = ['./bin/live-reload.js'];
}

const context = await esbuild.context(buildOptions);

// Build files in prod
if (PRODUCTION) {
  removeSourceMaps();
  await context.rebuild();
  context.dispose();
}

// Watch and serve files in dev
else {
  await context.watch();
  await context
    .serve({
      servedir: BUILD_DIRECTORY,
      port: SERVE_PORT,
    })
    .then(logServedFiles);
}

/**
 * Logs information about the files that are being served during local development.
 */
function logServedFiles() {
  /**
   * Recursively gets all files in a directory.
   * @param {string} dirPath
   * @returns {string[]} An array of file paths.
   */
  const getFiles = (dirPath) => {
    const files = readdirSync(dirPath, { withFileTypes: true }).map((dirent) => {
      const path = join(dirPath, dirent.name);
      return dirent.isDirectory() ? getFiles(path) : path;
    });

    return files.flat();
  };

  const files = getFiles(BUILD_DIRECTORY);

  const filesInfo = files
    .map((file) => {
      if (file.endsWith('.map')) return;

      // Normalize path and create file location
      const paths = file.split(sep);
      paths[0] = SERVE_ORIGIN;

      const location = paths.join('/');

      // Create import suggestion
      const tag = location.endsWith('.css')
        ? `<link href="${location}" rel="stylesheet" type="text/css"/>`
        : `<script defer src="${location}"></script>`;

      return {
        'File Location': location,
        'Import Suggestion': tag,
      };
    })
    .filter(Boolean);

  globalThis.console.table(filesInfo);
}

/**
 * Removes dev-only source maps before production builds.
 */
function removeSourceMaps() {
  try {
    const directories = [BUILD_DIRECTORY_PATH];

    while (directories.length > 0) {
      const dirPath = directories.pop();

      if (!dirPath) continue;
      if (!isPathInsideBuildDirectory(dirPath)) {
        throw new Error(`Refusing to read outside ${BUILD_DIRECTORY}: ${dirPath}`);
      }

      const files = readdirSync(dirPath, { withFileTypes: true });

      for (const file of files) {
        const path = resolve(dirPath, file.name);

        if (!isPathInsideBuildDirectory(path)) {
          throw new Error(`Refusing to delete outside ${BUILD_DIRECTORY}: ${path}`);
        }

        if (file.isDirectory()) {
          directories.push(path);
        } else if (path.endsWith('.map')) {
          rmSync(path);
        }
      }
    }
  } catch (error) {
    if (error.code !== 'ENOENT') {
      throw error;
    }
  }
}

/**
 * Confirms a resolved path stays within the configured build output directory.
 * @param {string} path
 */
function isPathInsideBuildDirectory(path) {
  const relativePath = relative(BUILD_DIRECTORY_PATH, path);

  return relativePath === '' || (!relativePath.startsWith('..') && !isAbsolute(relativePath));
}
