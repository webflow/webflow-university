import js from '@eslint/js';
import globals from 'globals';
import tseslint from 'typescript-eslint';
import prettier from 'eslint-plugin-prettier';
import simpleImportSort from 'eslint-plugin-simple-import-sort';
import { defineConfig, globalIgnores } from 'eslint/config';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

// Get current directory (needed to tell ESLint which tsconfig to use in monorepo)
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export default defineConfig([
  // Ignore these folders
  globalIgnores(['dist', 'node_modules']),

  {
    // Apply to all TypeScript and JavaScript files
    files: ['**/*.{ts,js}'],

    // Use recommended rules from ESLint and TypeScript ESLint
    extends: [js.configs.recommended, tseslint.configs.recommended],

    languageOptions: {
      ecmaVersion: 2022,
      // Know about browser and Node.js globals (window, document, process, etc.)
      globals: {
        ...globals.browser,
        ...globals.node,
      },
      parserOptions: {
        // Tell TypeScript ESLint which package's tsconfig to use (monorepo requirement)
        tsconfigRootDir: __dirname,
      },
    },

    plugins: {
      prettier, // Enforce Prettier formatting
      'simple-import-sort': simpleImportSort, // Auto-sort imports
    },

    rules: {
      // Enforce Prettier formatting as errors
      'prettier/prettier': 'error',

      // Auto-sort imports
      'simple-import-sort/imports': 'error',
      'simple-import-sort/exports': 'error',

      // Warn about unused variables (but allow variables starting with _)
      '@typescript-eslint/no-unused-vars': [
        'error',
        {
          argsIgnorePattern: '^_',
          varsIgnorePattern: '^_',
        },
      ],

      // Warn about console.log (but allow console.warn and console.error)
      'no-console': ['warn', { allow: ['warn', 'error'] }],
    },
  },
]);
