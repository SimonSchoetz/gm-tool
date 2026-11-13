# Dev data server

`app/dev-data-server/` is Node code for development only: the Vite plugin that serves web mode (`app/docs/features/web-dev-mode.md`) a copy of the dev app's data, or a freshly seeded database, and the mirror step `pnpm run dev` runs before the Tauri app starts (`app/docs/features/dev-data-mirror.md`). It never reaches a release build. `runDevMirror.ts` runs under `node` with no build step, so it relies on Node's type stripping at the Node 24 floor that `engines.node` in `app/package.json` declares and `.nvmrc` pins; there is no fallback for an older Node.

## Hosts

- The folder has no `index.ts`. Its public files serve two module hosts, Vite's config loader (`vitePlugin.ts`) and the browser bundle (`protocol.ts`): a barrel exporting both would pull `node:sqlite` and `node:fs` into the browser graph, and a barrel exporting one would make the other import reach past it (`local/no-import-past-index`). `seed/seed.ts` and `seed/seedPlatform.ts` run in a third host, the short-lived Vite server `seedDatabase.ts` creates, which resolves the project aliases that neither of the other two hosts does.
- App and browser code import only `protocol.ts` from this folder, which `import-x/no-restricted-paths` in `app/eslint.config.js` enforces.
- A file's top-of-file comment starts with its host: `Node host`, or `Browser host` for `protocol.ts`. It never names the files that import it, because the lint above fixes who may import and a list of importers goes stale when a file splits.

## Imports

- A non-test file here outside `seed/` imports its siblings and the rest of `app/` by relative path, never through a project alias (`@domain`, `@db`, `@/`), because Vite's config loader bundles these files and resolves no path alias. The files under `seed/` run in the seed server, which resolves the aliases, so this bullet does not bind them. This departs from `app/domain/CLAUDE.md` — Imports, which sends external consumers through `@domain`.
- A file `node` loads — `runDevMirror.ts`, which the `dev` script runs, and every module its relative imports reach, `app/domain/database/` included — imports its relative modules with the `.ts` extension, which Node's type stripping requires, so it reaches only modules that do the same. A file Vite's config loader reaches — `vite.config.ts` and every module its relative imports reach, `vitePlugin.ts` among them, wherever under `app/` — imports its relative modules with `.ts` too (a directory import as `…/index.ts`; the `lint` row's `local/no-extensionless-node-host-import` enforces the extension in both sets), because Vite 8 warns that `configLoader: 'native'`, its planned default, needs the extension. The files under `seed/` and the test files under `__tests__/` import without an extension; `protocol.ts` imports nothing.

## SQL

SQL built here follows `app/db/CLAUDE.md` — Conventions, the rule beginning "Values are always bound", which governs every query in `app/`.

## Tests

Tests sit in `__tests__/` beside the code and start with `// @vitest-environment node`, since `node:sqlite` exists only in Node. Which files need one is in `app/CLAUDE.md` — Testing. Shared fixtures live in `__tests__/support/` and have tests of their own, per the shared Writing Tests rule "Shared test infrastructure is code". A test here that needs the app's migrated in-memory database imports `openTestDatabase` from `app/db/__tests__/support/sqlite-test-database.ts` rather than defining its own — an exception to that rule's bar on importing another layer's test support, for that module only.
