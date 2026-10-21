# Dev data server

`app/dev-data-server/` is Node code for development only: the Vite plugin that serves a copy of the installed app's data to web mode (`app/docs/features/web-dev-mode.md`), and the mirror step `pnpm run dev` runs before the Tauri app starts (`app/docs/features/dev-data-mirror.md`). It never reaches a release build.

## Hosts

- The folder has no `index.ts`. Its public files serve two module hosts, Vite's config loader (`vitePlugin.ts`) and the browser bundle (`protocol.ts`): a barrel exporting both would pull `node:sqlite` and `node:fs` into the browser graph, and a barrel exporting one would make the other import reach past it (`local/no-import-past-index`).
- App and browser code import only `protocol.ts` from this folder, which `import-x/no-restricted-paths` in `app/eslint.config.js` enforces.
- A file's top-of-file comment starts with its host: `Node host`, or `Browser host` for `protocol.ts`. It never names the files that import it, because the lint above fixes who may import and a list of importers goes stale when a file splits.

## Imports

- A non-test file here imports its siblings and the rest of `app/` by relative path, never through a project alias (`@domain`, `@db`, `@/`), because Vite's config loader bundles these files and resolves no path alias. This departs from `app/domain/CLAUDE.md` — Imports, which sends external consumers through `@domain`.
- A file that `node` runs directly (`runDevMirror.ts`, `devMirror.ts`) imports its relative modules with the `.ts` extension, which Node's type stripping requires. Every other file here, `protocol.ts` included, is loaded by Vite (its config loader or the browser bundle) or by Vitest, and imports without an extension.

## Tests

Tests sit in `__tests__/` beside the code and start with `// @vitest-environment node`, since `node:sqlite` exists only in Node. Which files need one is in `app/CLAUDE.md` — Testing. Shared fixtures live in `__tests__/support/` and have tests of their own, per the shared Writing Tests rule "Shared test infrastructure is code".
