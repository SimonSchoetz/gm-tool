// @ts-check
import path from 'node:path';
import eslint from '@eslint/js';
import { defineConfig } from 'eslint/config';
import { createTypeScriptImportResolver } from 'eslint-import-resolver-typescript';
import { importX } from 'eslint-plugin-import-x';
import reactHooks from 'eslint-plugin-react-hooks';
import { reactRefresh } from 'eslint-plugin-react-refresh';
import tseslint from 'typescript-eslint';
import noImportPastIndex from './eslint-rules/no-import-past-index.js';
import noWrappedLineComments from './eslint-rules/no-wrapped-line-comments.js';

export default defineConfig(
  { ignores: ['dist/**', 'src-tauri/**', 'coverage/**'] },
  eslint.configs.recommended,
  tseslint.configs.strictTypeChecked,
  tseslint.configs.stylisticTypeChecked,
  {
    languageOptions: {
      parserOptions: {
        projectService: {
          allowDefaultProject: ['lucide-react.d.ts'],
        },
      },
    },
    plugins: {
      local: {
        rules: {
          'no-import-past-index': noImportPastIndex,
          'no-wrapped-line-comments': noWrappedLineComments,
        },
      },
      'import-x': importX,
    },
    settings: {
      'import-x/extensions': ['.ts', '.tsx', '.js'],
      'import-x/parsers': { '@typescript-eslint/parser': ['.ts', '.tsx'] },
      'import-x/resolver-next': [
        createTypeScriptImportResolver({
          project: path.resolve(import.meta.dirname, 'tsconfig.eslint.json'),
        }),
      ],
    },
    rules: {
      '@typescript-eslint/no-unused-vars': [
        'error',
        { varsIgnorePattern: '^_', argsIgnorePattern: '^_' },
      ],
      '@typescript-eslint/consistent-type-definitions': ['error', 'type'],
      '@typescript-eslint/restrict-template-expressions': [
        'error',
        { allowNumber: true },
      ],
      'no-restricted-syntax': [
        'error',
        {
          selector: 'TSEnumDeclaration',
          message: 'Use "as const" objects instead of enums.',
        },
      ],
      'local/no-wrapped-line-comments': 'warn',
      'local/no-import-past-index': [
        'error',
        { passThroughDirs: [path.resolve(import.meta.dirname, 'domain')] },
      ],
      'import-x/no-cycle': ['error', { ignoreExternal: true }],
    },
  },
  reactHooks.configs.flat.recommended,
  reactRefresh.configs.vite(),
  {
    files: ['*.js', '*.mjs', '*.cjs', 'eslint-rules/**/*.js'],
    extends: [tseslint.configs.disableTypeChecked],
  },
  {
    files: ['vite.config.ts', 'vitest.config.ts'],
    extends: [tseslint.configs.disableTypeChecked],
  },
);
