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
import noUnnormalizedLookupResult from './eslint-rules/no-unnormalized-lookup-result.js';
import noUnusedExports from './eslint-rules/no-unused-exports.js';
import noWrappedLineComments from './eslint-rules/no-wrapped-line-comments.js';

// `no-restricted-syntax` takes its whole selector list from the last config block that sets it, so the block below that adds selectors for some files repeats this one instead of inheriting it.
const asConstOverEnum = {
  selector: 'TSEnumDeclaration',
  message: 'Use "as const" objects instead of enums.',
};

// app/CLAUDE.md — TypeScript Coding Style bans `undefined` as a value, a local variable's type and a return type in business logic. A comparison against `undefined` (`x !== undefined`, `case undefined:`) reads an optional field and stays allowed; a type member written `?: T | undefined` is not a local variable and is not matched.
const writtenUndefined = [
  {
    selector:
      "Identifier[name='undefined']:not(BinaryExpression > Identifier, SwitchCase > Identifier.test)",
    message:
      'Never write `undefined` as a value in this layer; `null` is "no value" (app/CLAUDE.md — TypeScript Coding Style). Comparing against `undefined` is fine.',
  },
  {
    selector:
      'VariableDeclarator > Identifier.id > TSTypeAnnotation > TSUnionType > TSUndefinedKeyword',
    message:
      'A local variable in this layer is never typed `| undefined`; type it `| null` (app/CLAUDE.md — TypeScript Coding Style).',
  },
  {
    selector: ':function > TSTypeAnnotation.returnType TSUndefinedKeyword',
    message:
      'A function in this layer never returns `undefined`; return `null` for "no value" (app/CLAUDE.md — TypeScript Coding Style).',
  },
];

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
          'no-unnormalized-lookup-result': noUnnormalizedLookupResult,
          'no-unused-exports': noUnusedExports,
          'no-wrapped-line-comments': noWrappedLineComments,
        },
      },
      'import-x': importX,
    },
    // `import-x/no-cycle` fails silently rather than erroring when these settings break: it reports no cycle through `.ts`/`.tsx` files once `import-x/extensions` or `import-x/parsers` stops listing those extensions, and none through a `paths` alias once the resolver's `project` tsconfig carries a `references` entry (`.claude/knowledge/eslint.md`); `eslint-rules/__tests__/no-cycle-canary.test.js` fails in either case.
    settings: {
      'import-x/extensions': ['.ts', '.tsx', '.js'],
      'import-x/parsers': { '@typescript-eslint/parser': ['.ts', '.tsx'] },
      'import-x/resolver-next': [
        createTypeScriptImportResolver({
          project: path.resolve(import.meta.dirname, 'tsconfig.json'),
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
      'no-restricted-syntax': ['error', asConstOverEnum],
      'local/no-wrapped-line-comments': 'warn',
      'local/no-import-past-index': [
        'error',
        { passThroughDirs: [path.resolve(import.meta.dirname, 'domain')] },
      ],
      'local/no-unnormalized-lookup-result': 'error',
      'local/no-unused-exports': 'error',
      'import-x/no-cycle': ['error', { ignoreExternal: true }],
    },
  },
  {
    // app/CLAUDE.md's `undefined` ban covers business logic, and a test helper returning `rows.at(0)` is none.
    files: ['**/__tests__/**'],
    rules: { 'local/no-unnormalized-lookup-result': 'off' },
  },
  {
    // A context is read through its own named `use*` hook file, so a component never holds the context object; those hook files and files under a hooks/ folder are the only places `useContext` is called.
    files: ['src/**/*.{ts,tsx}'],
    ignores: ['src/**/use*.ts', 'src/**/hooks/**'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          paths: [
            {
              name: 'react',
              importNames: ['useContext'],
              message:
                'Call useContext only inside a named use* reader hook in its own file (e.g. src/providers/DeleteDialogProvider/useDeleteDialog.ts) and read the context through that hook here.',
            },
          ],
        },
      ],
      'no-restricted-properties': [
        'error',
        {
          object: 'React',
          property: 'useContext',
          message:
            'Call useContext only inside a named use* reader hook in its own file and read the context through that hook here.',
        },
      ],
    },
  },
  {
    // The non-UI layers, where app/CLAUDE.md's `undefined` ban has no exemptions; `src/` keeps optional props under exactOptionalPropertyTypes, third-party arguments, DOM attributes and style objects that take `undefined` by their own contracts.
    files: [
      'db/**/*.ts',
      'domain/**/*.ts',
      'services/**/*.ts',
      'util/**/*.ts',
      'platform/**/*.ts',
      'dev-data-server/**/*.ts',
    ],
    ignores: ['**/__tests__/**'],
    rules: {
      'no-restricted-syntax': ['error', asConstOverEnum, ...writtenUndefined],
    },
  },
  {
    // Every Tauri call goes through @platform (app/platform/index.ts), whose Tauri implementation is the only runtime importer of @tauri-apps/*; a type-only import stays allowed everywhere, and a vi.mock('@tauri-apps/…') specifier is not an import declaration.
    files: ['**/*.{ts,tsx}'],
    ignores: ['platform/**'],
    rules: {
      '@typescript-eslint/no-restricted-imports': [
        'error',
        {
          patterns: [
            {
              group: ['@tauri-apps/*'],
              allowTypeImports: true,
              message:
                'Import Tauri through @platform; only app/platform/ imports @tauri-apps/* at runtime (type-only imports stay allowed).',
            },
          ],
        },
      ],
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
