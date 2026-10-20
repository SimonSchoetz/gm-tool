# Dev mirror and HP field

- Sub-feature 1: Dev data mirror — `pnpm run dev` replaces the Tauri dev app's database and images with a fresh copy of the installed release app's data, keeping the dev app's own identity and paired devices
- Sub-feature 2: HP field — the Basic Stat Block's HP number field loses its stepping arrows, and its row lines up with the editor text in the shared label style

Neither sub-feature is a Foundation sub-feature: each leaves the every-check rows of root `CLAUDE.md` — Tool Use Discipline (`type-check`, `lint`, `format-check`, from `app/`) passing on its own, and sub-feature 2 consumes nothing sub-feature 1 adds. `app/src-tauri/` is not touched, so no Rust row runs. Sub-feature 1 lives in `app/dev-data-server/`, which is none of the six layers of `app/docs/CLAUDE.md` — Layered breakdown (Node tooling that Vite's config loader and `node` run); sub-feature 2 is Frontend only.

## Key Architectural Decisions

Ids point at the decisions' source documents: `row N` is line N of the Decisions table in `.claude/cycles/2026-10-20-dev-mirror-hp-field-lead/01-lead-story.md`, `C<n>` is Challenge n of `.claude/cycles/2026-10-20-dev-mirror-hp-field-lead/02-architect-verdict.md`.

### The mirror runs as a pre-step of the `dev` npm script

`app/package.json`'s `dev` script runs the mirror entry with `node`, then `tauri dev`, joined by `&&` (row 40, C1).

### A resolved-path equality guard runs before any write

`mirrorInstalledData` throws when the resolved source directory equals the resolved target directory, before touching any file (C2).

### The copy is built in a staging folder and swapped in only when complete

A mirror failure aborts `pnpm run dev` with a non-zero exit and leaves the old dev data intact; the staging folder is `<targetDir>/.mirror-staging`, on the same filesystem as the target (row 47, C4).

### The old dev database is opened before the swap

It is opened with a plain writable connection, which recovers its own `-wal`, before its identity rows are read; the swap then removes its `-wal` and `-shm` along with its main file (C3).

### The preserved set is exactly `paired_devices`, `_sync_peers` and the `_system` row `device`

Every other table, `_sync_changes` and `_sync_meta` included, follows the release data; the release's three row sets are never copied (rows 33, 39, 46, C6). Web mode, by contrast, keeps the release's paired devices in its copy because it never connects to a peer.

### Preserved row sets are copied for the columns both tables have

A table missing from the copy aborts and names the table (C5, row 47).

### The staging rows of the three preserved sets are always deleted; the old dev rows are inserted only for a table the old dev database has

Skipping the delete when the old dev database lacks a table would leave the release's paired devices, sync cursors or device row in the dev app, which acceptance forbids; deleting unconditionally keeps the release identity out whatever the old dev database holds.

### No installed release data, or a release directory that cannot be located, starts the dev app anyway

The entry prints a notice and exits 0; an unlocatable directory includes any platform other than macOS (rows 34, 41, architect ruling).

### A `-wal` the release database leaves behind is recovered in place; nothing else under the release directory changes

Same behaviour as web mode (row 42, C15).

### The mirror's files live in `app/dev-data-server/`, and the two files `node` runs import by explicit `.ts` extension

The folder is the only place the `import-x/no-restricted-paths` zone in `app/eslint.config.js` allows imports of it (C9). A `.ts` file run as `node <file>.ts` resolves a relative import written with its `.ts` extension [spec-writer_1: ran `node dev-data-server/scratchMirrorEntry.ts` and `node dev-data-server/scratchZod.ts` from `app/` — observed a `./scratchMirrorLib.ts` import, `node:sqlite` and `zod` resolving] and fails on one written without it [spec-writer_8: ran `node dev-data-server/scratchA.ts` from `app/` — observed `ERR_MODULE_NOT_FOUND` for `./scratchB`]; `devMirror.ts` and `runDevMirror.ts` are those files, while every other file of the folder keeps its extensionless imports because only Vite's config bundler and Vitest load it (C10).

### `DEVICE_SYSTEM_KEY` moves to `installedAppData.ts`

`commands.ts` and `devMirror.ts` both need the `_system` key `'device'`, and neither can import `db/_system/device.ts`, which reaches `@platform` through `db/database.ts`; one exported constant in the folder replaces the private copy (verdict Part 1).

### The entry is tested as a child process against a temporary home directory

`runDevMirror.ts` holds the exit codes that decide whether the dev app starts on stale data, and it resolves every path from `homedir()`, which returns `HOME` when set [spec-writer_2: ran `HOME=/tmp/fakehome node dev-data-server/scratchHome.ts` from `app/` — observed `/tmp/fakehome`]; a test running it with `HOME` set to a temporary directory exercises the exit codes, the notices and the identifier-to-directory derivation without touching real data. Vitest provides `import.meta.dirname` in a test file and `spawnSync` returns a child's status and output [spec-writer_5: ran `npx vitest run dev-data-server/__tests__/scratch.test.ts` from `app/` — observed a passing test that spawned a `.ts` entry with `HOME=/tmp/fakehome` and asserted status 1, stdout and stderr].

### Sync state is mirrored; no code guard keeps the dev app from syncing to real paired devices; a concurrent dev app is not guarded

`_sync_changes` and `_sync_meta` follow the release content (row 46); the dev app is paired only with test devices (row 45); a second `pnpm run dev`, or a dev app left running, has its files swapped by the mirror (row 44).

### The HP row's left edge comes from an exported constant, applied through a component-scoped custom property

`TEXT_EDITOR_GUTTER_WIDTH` in `app/src/components/TextEditor/TextEditor.constants.ts` is applied by `BasicStatBlockSectionBody` as `--basic-stat-block-section-body-gutter-width` on its root element, which its stylesheet reads (C11).

### The constant sits in the editor's own constants file and leaves the module through its barrel

The editor owns the gutter, so the value lives where its owner's other constants live and the HP row imports it from `@/components/TextEditor` like the component itself. `app/src/CLAUDE.md` — Constants Trigger 1 stops at a module-directory boundary, and — Util vs. Helper Placement rung 3 admits only generic values, which a constant named for the text editor is not; no barrel under `app/src/components/` exports a constant [spec-writer_10: grep "export {" --include=index.ts app/src/components, filtered of lines of the form `export { Pascal } from './Pascal';` — none left; grep "export \*" --include=index.ts app/src/components — not found], so this is the first instance of the shape.

### The arrow-hiding rules are scoped to the HP input through a class; `Input.css` is not touched

The class `basic-stat-block-section-body-hp-input` is passed to `Input`, which forwards `className` to its `<input>` through `cn` (verdict Alternatives, arrow hiding).

### The field stays a number field; stepping and the arrows are checked by observation, never by a test

The field stays a number field with ArrowUp and ArrowDown stepping (rows 37, 43, C13). jsdom has no ArrowUp or ArrowDown handling and steps only through its `stepUp` and `stepDown` methods [spec-writer_4: grep ArrowUp app/node_modules/jsdom/lib/jsdom/living --include='*.js' -l — not found; app/node_modules/jsdom/lib/jsdom/living/nodes/HTMLInputElement-impl.js:573-574 — `stepUp(n = 1)`], so no test can pin it.

### The "HP" label takes the global `.label` class and stays without a colon

`BASIC_STAT_BLOCK_HP_LABEL` still renders "HP" (rows 35, 38).

### The row aligns by baseline

`align-items: baseline` replaces `center` on the HP row; when the measured baseline is off, the implementer stops and reports the offset without editing `Input.css` (C12).

## Sub-feature 1: Dev data mirror

`pnpm run dev` runs `node dev-data-server/runDevMirror.ts` and then `tauri dev --config src-tauri/tauri.dev.conf.json`. The entry replaces the dev app's database and images (data directory `~/Library/Application Support/com.gm-tool.dev/`, the identifier of `app/src-tauri/tauri.dev.conf.json`) with a copy of the installed release app's data (`~/Library/Application Support/com.gm-tool/`) [lead_1: ran ls "$HOME/Library/Application Support/" — observed `com.gm-tool` and `com.gm-tool.dev`, the latter holding `gm_tool.db`, `images/` and `connectivity/device.key`], keeping the dev app's own paired devices, sync peers and device row.

### Files affected

Modified:

- `app/dev-data-server/installedAppData.ts` — add `hasInstalledAppData`, make `assertInstalledAppData` call it, add `DEVICE_SYSTEM_KEY`, update the header comment
- `app/dev-data-server/commands.ts` — remove the private `DEVICE_SYSTEM_KEY` and its comment, import it from `./installedAppData`
- `app/dev-data-server/vitePlugin.ts` — import `readRepositoryJson` and `tauriConfigSchema` from `./repositoryJson`, remove their declarations and the `readFileSync` import that no longer has a use
- `app/dev-data-server/__tests__/installedAppData.test.ts` — add the `hasInstalledAppData` case; the existing `assertInstalledAppData` case stays valid because its throw and message are unchanged
- `app/package.json` — the `dev` script
- `app/docs/features/web-dev-mode.md` — Rules row 48 (line 48) and the failure bullet on line 25 stop describing `pnpm run dev` as using the real data untouched; the Where to look list gains `repositoryJson` beside `installedAppData`

New:

- `app/dev-data-server/devMirror.ts`
- `app/dev-data-server/runDevMirror.ts`
- `app/dev-data-server/repositoryJson.ts`
- `app/dev-data-server/__tests__/devMirror.test.ts`
- `app/dev-data-server/__tests__/runDevMirror.test.ts`
- `app/dev-data-server/__tests__/support/appDatabase.ts`
- `app/docs/features/dev-data-mirror.md`

Draft: `.claude/knowledge/node.md` (five entries appended: `.ts` extension imports, the extensionless failure, `os.homedir()` and `HOME`, `ATTACH DATABASE`, `pragma_table_info`), `.claude/knowledge/vitest.md` (one entry appended: `import.meta.dirname` and a spawned child under `HOME`) and `.claude/knowledge/jsdom.md` (one entry appended: no ArrowUp handling; consumed by sub-feature 2). They were written while verifying this spec's facts and are unreviewed drafts: read them against `.claude/knowledge/CLAUDE.md` and commit them under normal discipline; none is correct merely because the spec cites it. Scratch files used for the runs were deleted.

Deleted, Moved: none. A scan of every `Modified:` file above for the layer's violation classes found nothing to clean up, so no cleanup task is added.

### Tooling — `app/dev-data-server/`

`installedAppData.ts` additions:

- `hasInstalledAppData(dir: string): boolean` — true when `join(dir, INSTALLED_DATABASE_FILE)` exists. `assertInstalledAppData` calls it and keeps its throw and message.
- `DEVICE_SYSTEM_KEY = 'device'` with the comment that moves from `commands.ts` (it names the live home `db/_system/device.ts` and why it cannot be imported); KAD: `DEVICE_SYSTEM_KEY` moves to `installedAppData.ts`.
- The header comment says the file is imported by `vitePlugin.ts` and by `devMirror.ts`, which `node` runs directly.

`repositoryJson.ts` exports `readRepositoryJson` and `tauriConfigSchema`, moved unchanged from `vitePlugin.ts`; both `vitePlugin.ts` and `runDevMirror.ts` import them. `packageJsonSchema` stays in `vitePlugin.ts`, its only consumer. `import.meta.dirname` still resolves the relative paths, because the new file sits in the same folder.

`devMirror.ts` exports `mirrorInstalledData`, taking `{ sourceDir, targetDir }` (the release and the dev data directories) and returning synchronously `'mirrored'` after a mirror and `'no-installed-data'` when the release app has no database. Its relative imports carry the `.ts` extension (KAD: The mirror's files live in `app/dev-data-server/`, and the two files `node` runs import by explicit `.ts` extension). It holds one module-private list of the three preserved row sets — `paired_devices`, `_sync_peers` and the `_system` rows whose `id` is `DEVICE_SYSTEM_KEY` — and runs these steps in order:

1. Throw when `resolve(sourceDir)` equals `resolve(targetDir)`; this runs before everything else, so a misconfigured pair throws whatever the directories hold.
2. Return `'no-installed-data'` when `hasInstalledAppData(sourceDir)` is false, having touched nothing, `targetDir` not created either.
3. Create `targetDir`, remove any `<targetDir>/.mirror-staging`, create it fresh.
4. Build the staging copy with `copyDatabase(sourceDir, staging)` and `copyImages(sourceDir, staging)` from `installedAppData.ts`; reuse them, never reimplement the copy.
5. Open the staged database with a plain writable `DatabaseSync`. For each preserved set: throw naming the table when the staged database lacks it, then delete the set's staged rows, whatever the old dev database holds (KAD: The staging rows of the three preserved sets are always deleted).
6. When `<targetDir>/gm_tool.db` exists, `ATTACH` it as `dev` on that connection (the attach recovers the old dev database's `-wal` [spec-writer_3: ran `node dev-data-server/scratchMirrorEntry.ts` from `app/` — observed a `-wal` copied beside an attached database read in full and removed after `DETACH` and `close()`]). For each preserved set whose table the old dev database has, insert the old dev rows into the staged table for the columns both tables have, found with `pragma_table_info(<table>, <schema>)` [spec-writer_9: ran `node dev-data-server/scratchMirrorEntry.ts` from `app/` — observed the `main` and `dev` column lists intersecting while the dev side held an extra column]; the `_system` set inserts only the rows whose `id` is `DEVICE_SYSTEM_KEY`. Detach.
7. Close the connection, so the staged database leaves neither a `-wal` nor a `-shm` behind.
8. Remove `gm_tool.db`, `gm_tool.db-wal`, `gm_tool.db-shm` and `images/` from `targetDir`, then rename the staged `gm_tool.db` and `images/` into it.
9. Remove the staging folder and return `'mirrored'`.

On any throw after step 3, close any open connection, remove the staging folder, and rethrow. `<targetDir>/connectivity/` and every `gm_tool.db.bak-*` file are never touched. Dispositions of the mirrored roles: the release `-wal` is recovered in place by `copyDatabase`, as web mode already does; release `images/` is read-only; dev `-wal` and `-shm` are removed; dev `images/` is replaced.

Named code comments the implementer writes, each naming only the constructs it explains: at the equality guard, that without it a `tauri.dev.conf.json` lacking its `identifier` would make the target the release directory, and step 8 would delete the release data; at step 8, that removing `gm_tool.db-wal` and `gm_tool.db-shm` with the main file keeps a stale log from being replayed under the new database; at step 5, why the delete is unconditional (the old dev database can lack a table, and the release rows must still not survive).

`runDevMirror.ts` is wiring only; its relative imports carry the `.ts` extension, for the reason in the KAD named above. It reads the release identifier from `tauri.conf.json` and the dev identifier from `tauri.dev.conf.json` through `readRepositoryJson` and `tauriConfigSchema`, resolves `sourceDir` with `resolveInstalledAppDataDir(process.platform, homedir(), releaseIdentifier)` inside a narrow `try`, derives `targetDir` as `join(dirname(sourceDir), devIdentifier)` (no second `Library/Application Support` literal), and calls `mirrorInstalledData`. Outcomes:

- A throw from `resolveInstalledAppDataDir`: print the error's text and a sentence saying the dev app starts on the data it already holds; exit status 0.
- `'no-installed-data'`: print a notice naming the absolute path `join(sourceDir, INSTALLED_DATABASE_FILE)` — `~/Library/Application Support/com.gm-tool/gm_tool.db` on this machine, the form web mode's missing-data error also prints — and the same sentence; exit status 0.
- `'mirrored'`: print one line naming `targetDir`; exit status 0.
- Any other throw: print `String(error)` to stderr and set `process.exitCode = 1`, so `&&` stops before `tauri dev` [spec-writer_6: ran `npx tsc --noEmit` and `npx eslint dev-data-server/scratchCatch.ts` from `app/` on `try { run(); } catch (error) { console.error(String(error)); process.exitCode = 1; }` — observed no report from either, and `node` printing `Error: boom` with exit status 1]. The entry never calls `instanceof`.

`app/package.json`: `"dev": "node dev-data-server/runDevMirror.ts && tauri dev --config src-tauri/tauri.dev.conf.json"`. `beforeDevCommand`, `dev:frontend`, `web` and `pnpm run web` stay as they are. The dev app runs pending migrations on the mirrored database at start, as it does today.

### Behaviours and their defects

`__tests__/installedAppData.test.ts`:

- `hasInstalledAppData` is false for a directory without the database file and true once it exists — a mirror or notice that mistakes missing data for present data.

`__tests__/devMirror.test.ts` (real SQLite in `createTempDirectory` directories, `// @vitest-environment node`, as `installedAppData.test.ts`):

- After a mirror the dev database holds the release rows of a content table, the dev-only rows and a dev edit to a row id both sides hold are gone, and the dev `images/` equals the release's — a merge in place of a replacement, or stale dev images.
- The dev `paired_devices` (two devices), `_sync_peers` and `device` row survive while the release's three row sets are absent, another `_system` row (`versioning`) follows the release, and the fixture holds a stale dev `-wal` — preserving a whole table, `_system` included, or a swap that leaves the old log beside the new database.
- A dev `paired_devices` with a column the release copy lacks, and the reverse, mirror without error and carry the shared columns — a `SELECT *` transplant that breaks on schema skew.
- The release directory's listing and database bytes are the same after a mirror, and the dev `connectivity/device.key` and a `gm_tool.db.bak-` file survive — a copy that writes to the release directory, or a swap that wipes the dev directory and its identity.
- `'no-installed-data'` leaves the dev directory untouched and does not create a missing one — a mirror that deletes the dev data when there is nothing to replace it with.
- `sourceDir` equal to `targetDir` throws and every file survives — the guard missing or running after a delete.
- A copy lacking `paired_devices` while the dev database has it throws naming the table and leaves the old dev database readable with its rows, its images and no staging folder — a swap before the transplant is complete.
- A first run with no dev directory creates it, holds the release content and no release identity rows — a first dev run that inherits the release's paired devices.

`__tests__/runDevMirror.test.ts` (`// @vitest-environment node`, `describe.runIf(process.platform === 'darwin')` because the entry resolves the macOS path; the release directory comes from `resolveInstalledAppDataDir('darwin', home, releaseIdentifier)` and the expected dev directory from the same call with the dev identifier, both identifiers read through `readRepositoryJson` and `tauriConfigSchema`, the databases written by `writeAppDatabase`; the child is `spawnSync(process.execPath, [<entry path from import.meta.dirname>], { env: { ...process.env, HOME: <temp dir> }, encoding: 'utf8' })`):

- With release data under the temporary home, exit status 0 and the data lands in the `com.gm-tool.dev` directory beside it, the release directory unchanged — a target derived from the wrong identifier or directory.
- With no release data, exit status 0, the output names the expected database path and the dev directory is untouched — a missing database that blocks the dev app, or a notice without the path.
- With a release database lacking `paired_devices`, a non-zero exit status, stderr naming the table and the old dev data intact — an error swallowed so the dev app starts on stale data.

The outcome of a throw from `resolveInstalledAppDataDir` cannot be driven on macOS, the only platform of the project's machine and CI, and has no test; its only effect is a notice and exit status 0.

Shared fixture: both new test files build release and dev databases, so one module builds them, `__tests__/support/appDatabase.ts`, beside `tempDirectory.ts`. It exports only `writeAppDatabase(dir, options)`, which writes `<dir>/gm_tool.db` as a closed database (no `-wal`) holding a test-only table `notes (id TEXT PRIMARY KEY, body TEXT)`, `paired_devices (id, name, created_at, updated_at)`, `_sync_peers (id, last_received_seq)` and `_system (id, value)`, filled from the optional `options` lists `notes`, `pairedDevices`, `syncPeers` and `system`, with the flag `omitPairedDevices` leaving that table out and the flag `pairedDevicesExtraColumn` adding a column `extra` to it. The stale dev `-wal` of the second `devMirror.test.ts` behaviour is made inside that test, the way `installedAppData.test.ts` leaves a `-wal` and `-shm` beside a database (a WAL writer in another directory, its three files copied in). After writing the tests, invert the equality guard, the unconditional delete and the `process.exitCode` assignment one at a time and confirm the matching test fails.

### Documentation

- `app/docs/features/dev-data-mirror.md` (new), in the shape of the sibling feature pages (Purpose, How it works with Happy path and Failure and where the user waits, Data, Rules table of Rule / Why / Source, Open points, Where to look). Rules: the dev app's database and images are replaced at every `pnpm run dev` start and its edits do not survive a restart (proposed by Claude, accepted by Simon Schötz, 2026-10-20); content only, with the preserved set exactly `paired_devices`, `_sync_peers` and the `_system` row `device`, the dev app keeping its device identity and key file (proposed by Claude, accepted by Simon Schötz, 2026-10-20, and Claude's call, 2026-10-20); no release data, or a release directory that cannot be located, gives a notice and the dev app starts on its own data (Why: the release data cannot be found; Source: not recorded for the first, Claude's call, 2026-10-20 for the second); the mirror is a pre-step of the `dev` script and never a Vite plugin hook, `beforeDevCommand` or Rust code, because Vite restarts and Tauri hot-restarts would re-mirror under a live app (Claude's call, 2026-10-20); a `-wal` the release leaves behind is recovered in place as web mode does (Claude's call, 2026-10-20); a second concurrent `pnpm run dev` is not guarded (Claude's call, 2026-10-20); no guard keeps the dev app from syncing to real paired devices, the user pairing it only with test devices (proposed by Claude, accepted by Simon Schötz, 2026-10-20); `_sync_changes` and `_sync_meta` are mirrored with the content, and whether a peer's cursor for the dev device goes stale is unverified (proposed by Claude, accepted by Simon Schötz, 2026-10-20); a mirror failure aborts `pnpm run dev` with a non-zero exit and the old dev data intact, and a table missing from the copy aborts naming the table (proposed by Claude, accepted by Simon Schötz, 2026-10-20). Where to look: the new files, the `dev` script, the tests.
- `app/docs/features/web-dev-mode.md`: row 48 (line 48) says `pnpm run dev` uses the real commands and starts no dev data server, and that its database and images are a fresh copy of the installed release app's data per `dev-data-mirror.md`; the failure bullet on line 25 keeps its statement that `pnpm run dev` starts Vite alone through `dev:frontend` and adds that the mirror runs before it; the Where to look list names `repositoryJson`. Rows 56, 63, 70 and 71 stay true and are not edited.

### Verification

Implementer steps: from `app/`, run every every-check row (`npx tsc --noEmit`, `npx eslint .`, `npx prettier --check .`) and `npx vitest run dev-data-server`; each is expected to pass once the sub-feature is complete (reasoned from the listed changes, not run). The `&&` joining the entry and `tauri dev` is the only link between the entry's exit status and the dev app not starting, and no test covers it: run `HOME=<an empty scratch directory holding a text file as Library/Application Support/com.gm-tool/gm_tool.db> pnpm run dev` from `app/`, expect the entry's own error line (starting `Error:`) as the last output and no output from `tauri dev` after it, so the run is told apart from a pnpm failure (reasoned from the shell's semantics, not run). The feature page's rule on a mirror failure names the `&&` as the load-bearing part.

Hand-off for the human tester, in the Tauri app, which an agent session cannot drive:

- Run `pnpm run dev`, confirm the dev app lists the adventures, entities, sessions and images the release app holds, rename an entity, quit, run `pnpm run dev` again and confirm the rename is gone; change something in the release app between the two starts and confirm it shows in the second. Compare a listing with sizes and modified times of `~/Library/Application Support/com.gm-tool/` before and after, expecting no difference apart from a recovered `-wal`.
- Confirm the dev app's Settings shows no paired device from the release app and shows the same device identity and own paired devices before and after a restart of `pnpm run dev`.

## Sub-feature 2: HP field

The HP number field in a Basic Stat Block section shows no stepping arrows, keeps ArrowUp and ArrowDown stepping, and its row starts at the editor text's left edge with "HP" in the shared label style on one baseline with the number. Saving, reverting an unsaveable value on blur and the empty-HP look stay as they are. Today the row sits flush with the panel edge while the editor text is indented 16px, and the number input sits 1px lower than the label [lead_1: ran `preview_start web`, then `getBoundingClientRect` in the browser pane — observed `.basic-stat-block-section-body-hp` left 500, `[contenteditable]` `padding-left: 16px`, label top 194, input top 195]. The popup's HP line is not part of this sub-feature: its own layout has no editor gutter to align with.

### Files affected

Modified:

- `app/src/components/TextEditor/TextEditor.constants.ts` — add `export const TEXT_EDITOR_GUTTER_WIDTH = 'var(--spacing-md)'`
- `app/src/components/TextEditor/TextEditor.tsx` — import the constant beside `EXTERNAL_SYNC_TAG` and use it for the non-read-only value of `--text-editor-gutter-width`; rendered values are unchanged
- `app/src/components/TextEditor/index.ts` — explicit named exports of `TextEditor` and `TEXT_EDITOR_GUTTER_WIDTH`, per `app/src/CLAUDE.md` — Barrel Files (a module barrel exporting multiple distinct things uses explicit exports; `export *` is not used)
- `app/src/screens/base-entity/components/BaseEntityContentSectionPanel/components/BasicStatBlockSectionBody/BasicStatBlockSectionBody.tsx`
- `app/src/screens/base-entity/components/BaseEntityContentSectionPanel/components/BasicStatBlockSectionBody/BasicStatBlockSectionBody.css`
- `app/docs/features/basic-stat-block.md` — see Documentation

New, Deleted, Moved, Draft: none beyond the jsdom knowledge entry listed under sub-feature 1. No file under `src/` imports `BasicStatBlockSectionBody` in a test, and no test imports the `TextEditor` barrel, so no assertion goes stale. A scan of every `Modified:` file above for the layer's violation classes (inline sub-components, `return null` and `return undefined` in void contexts, the `src-components.md` and `src-css.md` rules) found nothing to clean up, so no cleanup task is added. `BasicStatBlockSectionBody.tsx`'s bare `return;` for a missing section is the codebase's component pattern, not a void-context violation. The existing `[DEFERRED-VIOLATION: .claude/rules/src-components.md, Controlled inputs that drive auto-save mutations, Case 1 …]` comment in that file stays untouched.

### Frontend

`TextEditor.constants.ts`, `TextEditor.tsx`, `index.ts`: as listed. First-instance shape of the constant: name `TEXT_EDITOR_GUTTER_WIDTH`; file `app/src/components/TextEditor/TextEditor.constants.ts`; a string, the value `'var(--spacing-md)'`; a one-line comment naming that the editor's own root and `BasicStatBlockSectionBody`'s HP row both read it; importable by the Frontend through `@/components/TextEditor` and by nothing below the Frontend, since lower layers never import `src/` (KAD: The constant sits in the editor's own constants file and leaves the module through its barrel).

`BasicStatBlockSectionBody.tsx`:

- Purpose: the Basic Stat Block body, an HP row above the section's text editor. This change makes the row line up with the editor text.
- Behavior: unchanged — saves, reverts on blur and the empty-HP look keep `readSaveableHp`, the `hpInputRevision` remount and the handlers as they are; `type='number'` stays.
- UI / Visual: import `TEXT_EDITOR_GUTTER_WIDTH` from `@/components/TextEditor` and `type CSSProperties` from `react`; the root `div` takes `style` set to one object with the single property `--basic-stat-block-section-body-gutter-width` valued `TEXT_EDITOR_GUTTER_WIDTH`, cast `as CSSProperties` (`.claude/rules/src-components.md` — Component-scoped custom properties; KAD: The HP row's left edge comes from an exported constant, applied through a component-scoped custom property); the "HP" `span` takes `className='label'` and keeps the text from `BASIC_STAT_BLOCK_HP_LABEL` without a colon; `Input` takes `className='basic-stat-block-section-body-hp-input'` (KAD: The arrow-hiding rules are scoped to the HP input through a class).

`BasicStatBlockSectionBody.css`:

- Remove `.basic-stat-block-section-body-hp-label`.
- `.basic-stat-block-section-body-hp`: `align-items: baseline` in place of `center`, and `padding-left: var(--basic-stat-block-section-body-gutter-width)`.
- `.basic-stat-block-section-body-hp-input`: `appearance: textfield`, and the `::-webkit-inner-spin-button` and `::-webkit-outer-spin-button` pseudo-elements each with `-webkit-appearance: none` and `margin: 0`.
- No raw pixel, colour or `rem` value is introduced and no token is added under `styles/variables/`.
- A CSS comment above the arrow rules states that the field stays `type='number'` because `readSaveableHp` reads `badInput` and the browser's own ArrowUp and ArrowDown stepping depends on it, so hiding the arrows is done in CSS only, and a text input would break both.

### Behaviours and their defects

No test file is added: the Testing Policy forbids component tests except for a criterion only the component's event handling decides, and none of the criteria changed here is one — the arrows, the alignment and the label style are decided by CSS and the browser, and jsdom neither computes layout nor steps a number input from the keyboard [spec-writer_4: grep ArrowUp app/node_modules/jsdom/lib/jsdom/living --include='*.js' -l — not found; app/node_modules/jsdom/lib/jsdom/living/nodes/HTMLInputElement-impl.js:573-574 — `stepUp(n = 1)`].

[MANUAL-VERIFY] ArrowUp and ArrowDown in the focused HP field still step the number by one after the arrow-hiding rules, in the Tauri app's webview (`pnpm run dev`): click into a Basic Stat Block's HP field holding `5`, press ArrowUp, expect `6`, press ArrowDown twice, expect `4`.

[MANUAL-VERIFY] No stepping arrows show on the HP field with the pointer over it and with it focused, in the Tauri app's webview.

[MANUAL-VERIFY] The "HP" label's left edge equals the left edge of the editor text beneath it, and "HP" and the number share one text baseline, in the Tauri app's webview and at the window width of 1000 and a wider one.

[MANUAL-VERIFY] The "HP" label has the same font, colour and size as an adventure stats label ("Started", "Sessions") and still reads "HP" without a colon, in the Tauri app's webview.

The hand-off items above are for the human tester; they depend on WKWebView, which an agent session cannot drive.

### Documentation

`app/docs/features/basic-stat-block.md`:

- Replace the Rules row on line 54 (HP row layout): the panel's HP row is one row above the editor, "HP" in the shared label style (the global `.label` class, as the adventure stats), then the number field filling the rest of the row with small spacing, the row's label and number on one baseline, the row starting at the editor text's left edge through the editor's gutter constant, scrolling with the text. Why: the user wants the row to line up with the editor text and the label to look like the other labels. Source: Simon Schötz, 2026-10-20.
- Replace the row on line 57 (stepping arrows): the HP number field shows no stepping arrows, with the pointer over it or focused, and keeps ArrowUp and ArrowDown stepping by one; it stays a number field. Why: the user does not like the arrows; the save and revert logic reads the browser's `badInput`, which only a number field reports. Source: Simon Schötz, 2026-10-20 for the arrows, Claude's call, 2026-10-20 for staying a number field.
- Add rows: the label reads "HP" without a colon, only its styling comes from the adventure stats (Claude's call, 2026-10-20); the arrow-free look, keyboard stepping, alignment and label style are checked by measuring in the `web` pane and by a hand test in `pnpm run dev`, not by a unit test, because the browser decides the outcome and jsdom does not step number inputs (Claude's call, 2026-10-20).
- Revise the Why of the row on line 58 (popup HP line): it no longer matches the panel's HP label, which now takes the shared label style; the popup's own styling is out of this change's scope and unchanged.
- Where to look: add `TextEditor.constants` (the gutter width) beside `BasicStatBlockSectionBody`.

### Verification

Implementer steps, executable in an agent session through `preview_start web` (the `web` launch configuration in `.claude/launch.json`, which serves the copied production data; take a second screenshot after any click):

- Add a Basic Stat Block section to an entity, then confirm with a screenshot taken with the pointer over the HP field and another with it focused that no arrows show.
- With `getBoundingClientRect`, confirm the HP row's label left edge equals the `[contenteditable]` element's content left edge (its left plus its computed `padding-left`), and report the measured vertical offset between the label's and the number's baselines in pixels. When the offset is not zero because `Input.css` sets `line-height: 0`, stop, report the measured offset to the caller and do not edit `Input.css`.
- With `getComputedStyle`, confirm the label's `font-family`, `color` and `font-size` equal those of an adventure stats label on the adventure screen.
- Type a value, blur with `1.` held, and clear the field: the saved value, the revert and the empty look are as before.
- Run the every-check rows from `app/` (`npx tsc --noEmit`, `npx eslint .`, `npx prettier --check .`); each is expected to pass once the sub-feature is complete (reasoned from the listed changes, not run).
- Report every raw value introduced into a `.css` file with its path, line and value, per `.claude/rules/src-css.md` — Design token obligation; the specification introduces none.

## CLAUDE.md impact

- Root `CLAUDE.md`, Development Commands, describes `pnpm run dev` as "Local Tauri environment" and says `pnpm run web` "cannot reach the database at all"; after this branch `pnpm run dev` replaces the dev app's data with a copy of the release app's data before launching, and web mode reaches a copy of the release database through the dev data server [spec-writer_11: CLAUDE.md:46,50 and app/docs/features/web-dev-mode.md:11-12 — as of 95fe6e69]. The section misdescribes both commands until it is revised.
- `app/src/CLAUDE.md`, Util vs. Helper Placement and Constants, name no home for a non-generic value consumed by its owning module and by a module in another `src/` directory: Constants Trigger 1 stops at a module-directory boundary, and the ladder's rung 3 admits only generic values. `TEXT_EDITOR_GUTTER_WIDTH` in `app/src/components/TextEditor/TextEditor.constants.ts`, exported through `app/src/components/TextEditor/index.ts` and imported by `app/src/screens/base-entity/components/BaseEntityContentSectionPanel/components/BasicStatBlockSectionBody/BasicStatBlockSectionBody.tsx`, is the first such value, and no other barrel under `app/src/components/` exports a constant [spec-writer_10: grep "export {" --include=index.ts app/src/components, filtered of lines of the form `export { Pascal } from './Pascal';` — none left; grep "export \*" --include=index.ts app/src/components — not found]. The next such case has no rule to follow.
- No `CLAUDE.md` states how files under `app/dev-data-server/` import each other. After this branch `devMirror.ts` and `runDevMirror.ts`, which `node` runs directly through the `dev` script, import by explicit `.ts` extension, and the folder's other files, loaded only by Vite's config bundler and Vitest, import without one; a Node-run file with an extensionless relative import fails [spec-writer_8: ran `node dev-data-server/scratchA.ts` from `app/` — observed `ERR_MODULE_NOT_FOUND` for `./scratchB`]. The `dev` script also depends on Node's built-in type stripping, which is verified on v24.21.0 only [spec-writer_1: ran `node dev-data-server/scratchMirrorEntry.ts` from `app/` — observed a relative `.ts` import running with no flag and no warning], while `app/package.json`'s `engines.node` is `^24.15.0` [spec-writer_12: app/package.json:10 — as of 95fe6e69].
- No `CLAUDE.md` or `.claude/rules/` file sets a test scope for `app/dev-data-server/`: `app/src/CLAUDE.md` — Testing Policy governs `src/`, and the db, services and domain files govern their own layers. The folder's tests (`app/dev-data-server/__tests__/`), among them `devMirror.test.ts` and `runDevMirror.test.ts`, rest on precedent, so no written rule obliges a test for a new file there.
