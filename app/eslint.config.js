// @ts-check
import path from 'node:path';
import eslint from '@eslint/js';
import { defineConfig } from 'eslint/config';
import { createTypeScriptImportResolver } from 'eslint-import-resolver-typescript';
import { importX } from 'eslint-plugin-import-x';
import reactHooks from 'eslint-plugin-react-hooks';
import { reactRefresh } from 'eslint-plugin-react-refresh';
import tseslint from 'typescript-eslint';
import noConstantArgument from './eslint-rules/no-constant-argument.js';
import noExtensionlessNodeHostImport from './eslint-rules/no-extensionless-node-host-import.js';
import noImportPastIndex from './eslint-rules/no-import-past-index.js';
import noInlineJsxValues from './eslint-rules/no-inline-jsx-values.js';
import noJsxCommentText from './eslint-rules/no-jsx-comment-text.js';
import noUnnormalizedLookupResult from './eslint-rules/no-unnormalized-lookup-result.js';
import noUnusedExports from './eslint-rules/no-unused-exports.js';
import noWrappedLineComments from './eslint-rules/no-wrapped-line-comments.js';

// `no-restricted-syntax` takes its whole selector list from the last config block that matches a file, so no block inherits a selector from an earlier one: the blocks below are the one place a scope's list is written, each in full through `syntaxRules`, which adds the enum selector itself.
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

// A string, or a RegExp not anchored at its end, makes `toThrow` pass for any message that merely contains it, so a test keeps passing after the message it pins down changes.
const looseToThrowMatcher = [
  {
    selector:
      "CallExpression[callee.property.name='toThrow'] > Literal.arguments:first-child[value=type(string)]",
    message:
      'toThrow with a string matches any message containing it; pass a RegExp anchored with ^ and $ for the exact message.',
  },
  {
    selector:
      "CallExpression[callee.property.name='toThrow'] > Literal.arguments:first-child[regex][regex.pattern!=/\\$$/]",
    message:
      'toThrow with a RegExp not ending in $ matches any message continuing past it; anchor it with $ (and ^) for the exact message.',
  },
];

const noClasses = [
  {
    selector:
      'ClassDeclaration:not([superClass]), ClassExpression:not([superClass])',
    message:
      'A class is allowed only where a third-party framework API requires inheritance, such as a Lexical node or a MenuOption subclass (app/CLAUDE.md — TypeScript Coding Style).',
  },
  {
    selector:
      "ClassDeclaration[superClass.name='Error'], ClassExpression[superClass.name='Error'], ClassDeclaration[id.name=/Error$/], ClassExpression[id.name=/Error$/]",
    message:
      'An error type is built by a factory function, never a class (app/CLAUDE.md — TypeScript Coding Style).',
  },
];

const noTry = [
  {
    selector: 'TryStatement',
    message:
      'No `try` in a data-access-layer or screen file; an error is handled in the service layer or reaches the Error Boundary (.claude/rules/src-data-access-layer.md — Non-negotiable rules).',
  },
];

const noExportStarDb = [
  {
    selector: 'ExportAllDeclaration',
    message:
      'A barrel under db/ names each export; `export *` is banned (app/db/CLAUDE.md — Conventions).',
  },
];

const noExportStarBarrel = [
  {
    selector: 'ExportAllDeclaration',
    message:
      'A grouping barrel names each export; `export *` is banned (app/CLAUDE.md — Directory Structure (all TypeScript layers)).',
  },
];

const noBuildCreateQuery = [
  {
    selector: "ImportSpecifier[imported.name='buildCreateQuery']",
    message:
      'A duplicate builds its INSERT with buildDuplicateQuery, never buildCreateQuery (app/db/CLAUDE.md — Duplication).',
  },
];

const typedViFn = [
  {
    selector:
      "CallExpression[callee.object.name='vi'][callee.property.name='fn'][arguments.length=0]:not([typeArguments])",
    message:
      'Type the spy against the real export, as in vi.fn<typeof sessionDb.create>() (.claude/rules/services-unit-tests.md — Wiring the mock).',
  },
];

const noRawReactTypes = [
  {
    selector:
      "TSQualifiedName[left.name='React'][right.name=/^(FC|HTMLProps)$|HTMLAttributes$/], TSTypeReference > Identifier.typeName[name=/^(FC|HTMLProps)$|HTMLAttributes$/]",
    message:
      'Use the FCProps and HtmlProps aliases from src/types/, never the raw React types (.claude/rules/src-components.md — Component Internals).',
  },
];

const noDefaultInputType = [
  {
    selector:
      "JSXOpeningElement[name.name='input'] > JSXAttribute[name.name='type'][value.value='text'], JSXOpeningElement[name.name='input'] > JSXAttribute[name.name='type'] > JSXExpressionContainer > Literal[value='text']",
    message:
      '`text` is the default type of an input; omit the attribute (.claude/rules/src-components.md — Component Internals).',
  },
];

const nonUiLayerGroups = [writtenUndefined, noClasses];
const srcFileGroups = [noClasses, noRawReactTypes, noDefaultInputType];

/**
 * @param {{ selector: string, message: string }[][]} groups
 * @returns {import('eslint').Linter.RuleEntry}
 */
const syntaxRules = (...groups) => ['error', asConstOverEnum, ...groups.flat()];

const tauriImportPattern = {
  group: ['@tauri-apps/*'],
  allowTypeImports: true,
  message:
    'Import Tauri through @platform; only app/platform/ imports @tauri-apps/* at runtime (type-only imports stay allowed).',
};

// A relative path into a restricted directory is restricted as its alias is. The patterns match the import's text, so they also report a folder of that name inside the importing layer when it is reached through `../`.
/** @param {string[]} directories */
const relativeImportsInto = (...directories) =>
  directories.flatMap((directory) => [
    `../**/${directory}`,
    `../**/${directory}/**`,
  ]);

/** @param {string[]} group */
const upwardImports = (group) => ({
  group,
  allowTypeImports: true,
  message:
    'A value import never points up the layer order, and platform/ imports no other layer; a type-only import is allowed (app/docs/CLAUDE.md — Plan Format Extension, Layered breakdown).',
});

// The src/ directories whose code sits above the data access layer. src/types/ (framework types) and src/__tests__/ (test support) stay importable from that layer.
const directoriesAboveDataAccess = [
  'components',
  'screens',
  'hooks',
  'providers',
  'routes',
  'util',
  'App',
];

export default defineConfig(
  {
    ignores: [
      'dist/**',
      'src-tauri/**',
      'coverage/**',
      '.stryker-tmp/**',
      'reports/**',
    ],
  },
  {
    // A disable comment that suppresses nothing fails the lint, for every rule: a `local/no-unused-exports` or `local/no-constant-argument` exemption, for one, turns into an error once a production file imports the export or a call site varies the argument.
    linterOptions: { reportUnusedDisableDirectives: 'error' },
  },
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
          'no-constant-argument': noConstantArgument,
          'no-extensionless-node-host-import': noExtensionlessNodeHostImport,
          'no-import-past-index': noImportPastIndex,
          'no-inline-jsx-values': noInlineJsxValues,
          'no-jsx-comment-text': noJsxCommentText,
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
      'no-restricted-syntax': syntaxRules(),
      'local/no-wrapped-line-comments': 'warn',
      'local/no-import-past-index': [
        'error',
        { passThroughDirs: [path.resolve(import.meta.dirname, 'domain')] },
      ],
      'local/no-unnormalized-lookup-result': 'error',
      'local/no-unused-exports': 'error',
      'local/no-constant-argument': 'error',
      'local/no-jsx-comment-text': 'error',
      // app/dev-data-server/CLAUDE.md — Imports: Vite's config loader and the `dev` script's `node` load these entries and every file their relative imports reach, where Node's type stripping requires the `.ts` extension and Vite 8 warns that its native config loader does.
      'local/no-extensionless-node-host-import': [
        'error',
        {
          entries: [
            path.resolve(import.meta.dirname, 'vite.config.ts'),
            path.resolve(
              import.meta.dirname,
              'dev-data-server/runDevMirror.ts',
            ),
          ],
        },
      ],
      'import-x/no-cycle': ['error', { ignoreExternal: true }],
    },
  },
  {
    // app/CLAUDE.md's `undefined` ban covers business logic, and a test helper returning `rows.at(0)` is none.
    files: ['**/__tests__/**'],
    rules: { 'local/no-unnormalized-lookup-result': 'off' },
  },
  {
    files: ['**/__tests__/**'],
    rules: { 'no-restricted-syntax': syntaxRules(looseToThrowMatcher) },
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
    // .claude/rules/src-components.md — Component Internals: a derived value or an event handler a component's JSX uses is a named const above the return, so a JSX attribute value is never an inline function, call, conditional, object or array outside `className`, `style` and what reads a `.map()` or `.flatMap()` callback's variable. The generated routeTree is a `.ts` file and a test's own JSX is out of the rule's scope.
    files: ['src/**/*.tsx'],
    ignores: ['src/**/__tests__/**'],
    rules: { 'local/no-inline-jsx-values': 'error' },
  },
  {
    // The non-UI layers and the platform module, where app/CLAUDE.md's `undefined` ban has no exemptions; `src/` keeps optional props under exactOptionalPropertyTypes, third-party arguments, DOM attributes and style objects that take `undefined` by their own contracts.
    files: [
      'db/**/*.ts',
      'domain/**/*.ts',
      'services/**/*.ts',
      'util/**/*.ts',
      'platform/**/*.ts',
    ],
    ignores: ['**/__tests__/**'],
    rules: { 'no-restricted-syntax': syntaxRules(...nonUiLayerGroups) },
  },
  {
    // The dev data server is under the same `undefined` ban.
    files: ['dev-data-server/**/*.ts'],
    ignores: ['**/__tests__/**'],
    rules: { 'no-restricted-syntax': syntaxRules(writtenUndefined) },
  },
  {
    files: ['db/**/index.ts'],
    ignores: ['**/__tests__/**'],
    rules: {
      'no-restricted-syntax': syntaxRules(...nonUiLayerGroups, noExportStarDb),
    },
  },
  {
    files: ['db/**/duplicate.ts'],
    ignores: ['**/__tests__/**'],
    rules: {
      'no-restricted-syntax': syntaxRules(
        ...nonUiLayerGroups,
        noBuildCreateQuery,
      ),
    },
  },
  {
    files: ['src/**/*.{ts,tsx}'],
    ignores: ['**/__tests__/**', 'src/types/**'],
    rules: { 'no-restricted-syntax': syntaxRules(...srcFileGroups) },
  },
  {
    // src/types/ declares the FCProps and HtmlProps aliases over the raw React types.
    files: ['src/types/**/*.{ts,tsx}'],
    ignores: ['**/__tests__/**'],
    rules: {
      'no-restricted-syntax': syntaxRules(noClasses, noDefaultInputType),
    },
  },
  {
    files: ['src/data-access-layer/**/*.{ts,tsx}', 'src/screens/**/*.{ts,tsx}'],
    ignores: ['**/__tests__/**'],
    rules: { 'no-restricted-syntax': syntaxRules(...srcFileGroups, noTry) },
  },
  {
    // The grouping barrels under src/; domain/index.ts keeps its `export *` lines (app/domain/CLAUDE.md — Structure).
    files: ['src/data-access-layer/index.ts', 'src/screens/index.ts'],
    rules: {
      'no-restricted-syntax': syntaxRules(
        ...srcFileGroups,
        noTry,
        noExportStarBarrel,
      ),
    },
  },
  {
    files: ['src/**/__tests__/**'],
    rules: {
      'no-restricted-syntax': syntaxRules(
        looseToThrowMatcher,
        noRawReactTypes,
        noDefaultInputType,
      ),
    },
  },
  {
    files: ['services/__tests__/**'],
    rules: {
      'no-restricted-syntax': syntaxRules(looseToThrowMatcher, typedViFn),
    },
  },
  {
    // Every Tauri call goes through @platform (app/platform/index.ts), whose Tauri implementation is the only runtime importer of @tauri-apps/*; a type-only import stays allowed everywhere, and a vi.mock('@tauri-apps/…') specifier is not an import declaration.
    files: ['**/*.{ts,tsx}'],
    ignores: ['platform/**'],
    rules: {
      '@typescript-eslint/no-restricted-imports': [
        'error',
        { patterns: [tauriImportPattern] },
      ],
    },
  },
  {
    // app/dev-data-server/ is Node code that Vite's config loader bundles; protocol.ts is the one file of it the browser bundle and app code import, and the db test support, which runs under Node, is the one other importer of its adapter. A second `@typescript-eslint/no-restricted-imports` block would replace the Tauri block's options for every file both match, so the boundary uses import-x's path rule.
    files: ['**/*.{ts,tsx}'],
    ignores: [
      'dev-data-server/**',
      'vite.config.ts',
      'db/__tests__/support/sqlite-test-database.ts',
    ],
    rules: {
      'import-x/no-restricted-paths': [
        'error',
        {
          basePath: import.meta.dirname,
          zones: [
            {
              target: '.',
              from: './dev-data-server',
              except: ['./protocol.ts'],
              message:
                'app/dev-data-server/ runs in Node inside Vite; app and browser code import only its protocol.ts.',
            },
          ],
        },
      ],
    },
  },
  {
    // The layer order, from the bottom, is domain/, platform/, db/, services/, the data access layer, then the rest of src/ (app/docs/CLAUDE.md — Plan Format Extension). In this block and the four that follow, the options replace the Tauri block's for every file both match, so each repeats its pattern, except platform/'s, whose files the Tauri block ignores.
    files: ['domain/**/*.{ts,tsx}'],
    rules: {
      '@typescript-eslint/no-restricted-imports': [
        'error',
        {
          patterns: [
            tauriImportPattern,
            upwardImports([
              '@platform',
              '@db/*',
              '@services/*',
              '@/*',
              ...relativeImportsInto('platform', 'db', 'services', 'src'),
            ]),
          ],
        },
      ],
    },
  },
  {
    files: ['platform/**/*.{ts,tsx}'],
    rules: {
      '@typescript-eslint/no-restricted-imports': [
        'error',
        {
          patterns: [
            upwardImports([
              '@domain',
              '@domain/*',
              '@db/*',
              '@services/*',
              '@/*',
              ...relativeImportsInto('domain', 'db', 'services', 'src'),
            ]),
          ],
        },
      ],
    },
  },
  {
    files: ['db/**/*.{ts,tsx}'],
    rules: {
      '@typescript-eslint/no-restricted-imports': [
        'error',
        {
          patterns: [
            tauriImportPattern,
            upwardImports([
              '@services/*',
              '@/*',
              ...relativeImportsInto('services', 'src'),
            ]),
          ],
        },
      ],
    },
  },
  {
    files: ['services/**/*.{ts,tsx}'],
    rules: {
      '@typescript-eslint/no-restricted-imports': [
        'error',
        {
          paths: [
            {
              name: 'react',
              allowTypeImports: true,
              message:
                'services/ takes no value import from react (app/services/CLAUDE.md — What Does NOT Belong Here).',
            },
          ],
          patterns: [
            tauriImportPattern,
            upwardImports(['@/*', ...relativeImportsInto('src')]),
          ],
        },
      ],
    },
  },
  {
    files: ['src/data-access-layer/**/*.{ts,tsx}'],
    rules: {
      '@typescript-eslint/no-restricted-imports': [
        'error',
        {
          patterns: [
            tauriImportPattern,
            upwardImports([
              ...directoriesAboveDataAccess.flatMap((directory) => [
                `@/${directory}`,
                `@/${directory}/*`,
              ]),
              ...relativeImportsInto(...directoriesAboveDataAccess),
            ]),
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
