# Node.js

## `node:sqlite` loads without a flag on Node v24.21.0, bundles SQLite 3.53.4, and enables foreign keys by default

**Verified at:** Node v24.21.0, run 2026-10-20
**Citation:** [implement_1: ran `node -e` with `new DatabaseSync(':memory:')` under `node -v` v24.21.0 — observed `sqlite_version()` 3.53.4, `PRAGMA foreign_keys` 1, and nothing on stderr]

`DatabaseSync` from `node:sqlite` works with no `--experimental-sqlite` flag and, on this Node line, without the experimental warning earlier lines printed. Foreign key enforcement is on for a fresh in-memory database without any `PRAGMA`, matching sqlx's default, and its engine version differs from any SQLite a native dependency bundles.

## `node:sqlite` needs no `--experimental-sqlite` flag from Node v22.13.0 on the 22.x line and from v23.4.0 on later lines

**Verified at:** <https://nodejs.org/api/sqlite.html>, fetched 2026-09-21
**Citation:** [spec-writer_6: https://nodejs.org/api/sqlite.html — History entry "v23.4.0, v22.13.0: SQLite is no longer behind `--experimental-sqlite` but still experimental"]

Node 22.x releases before 22.13.0 and 23.x releases before 23.4.0 do not load `node:sqlite` without the flag, so the semver range `^22.13.0 || >=23.4.0` is exactly the set of versions that load it without one. The module became a release candidate (stability 1.2) in v25.7.0.

## `node:sqlite` binds positional arguments to `?NNN` parameters by number, not by occurrence order

**Verified at:** Node v22.23.2 (SQLite 3.51.3), run 2026-09-19
**Citation:** [review-decision_2: ran `node -e` preparing `insert into t (b, a) values (?2, ?1)` and calling `.run('A-val', 'B-val')` — observed row `{ a: 'A-val', b: 'B-val' }`]

A `?N` parameter takes the N-th positional argument wherever it appears in the statement, so rewriting `$N` placeholders to `?N` keeps sqlx's bind-by-number semantics for the same values array.

## `DatabaseSync.prepare()` silently compiles only the first statement of a multi-statement string

**Verified at:** Node v22.23.2 (SQLite 3.51.3), run 2026-09-19
**Citation:** [review-decision_3: ran `node -e` with `db.prepare('create table a (x); create table b (y);').run()` — observed no error and only table `a` in `sqlite_master`]

Every statement after the first `;` is dropped without an error, unlike sqlx, which executes each top-level statement of one query string. `DatabaseSync.exec()` runs every statement but accepts no bind values.

## `node:sqlite` returns rows with a null prototype

**Verified at:** Node v22.23.2 (SQLite 3.51.3), run 2026-09-19
**Citation:** [harness-probe_35: ran a scratch probe reading rows through `DatabaseSync.prepare().all()` — observed `Object.getPrototypeOf(row) === null`] [harness-probe_37: same probe — observed Vitest `toEqual` against a plain literal passing, `toStrictEqual` failing, and template-string coercion throwing]

Code that treats a row like an ordinary object works, but a strict equality assertion or string coercion behaves differently from a plain-object row; copying with `{ ...row }` restores `Object.prototype`.

## `@types/node` 26.6.3 declares `node:sqlite`'s `DatabaseSync(path, options?)` with `readOnly` (default `false`), `enableForeignKeyConstraints` (default `true`) and `open` (default `true`), `StatementSync.run(...params)` returning `{ changes, lastInsertRowid }` as `number | bigint`, and a module-level `backup(sourceDb, path, options?): Promise<number>`

**Verified at:** @types/node 26.6.3, read 2026-10-20
**Citation:** [spec-writer_7: app/node_modules/@types/node/sqlite.d.ts:5-38 — `DatabaseSyncOptions` with `open`, `enableForeignKeyConstraints` and `readOnly` and their documented defaults; :262 — `constructor(path: PathLike, options?: DatabaseSyncOptions)`; :831-843 — `StatementResultingChanges { changes: number | bigint; lastInsertRowid: number | bigint }`; :870,902,933 — `StatementSync.all(...)`, `.get(...)` returning `Record<string, SQLOutputValue> | undefined`, `.run(...)`; :1050 — `function backup(sourceDb: DatabaseSync, path: PathLike, options?: BackupOptions): Promise<number>`]

A file-backed database opens read-write with foreign keys on by default; `run()`'s counts need `Number(…)` before they meet a `number`-typed contract, and `get()` can return `undefined`.

## A `.ts` file run directly as `node <file>.ts` on Node v24.21.0 imports sibling files by explicit `.ts` extension, `node:sqlite` and bare packages, and sets `import.meta.dirname` to its own directory

**Verified at:** Node v24.21.0, run 2026-10-20
**Citation:** [spec-writer_1: ran `node dev-data-server/scratchMirrorEntry.ts` and `node dev-data-server/scratchZod.ts` from `app/` — observed a relative `import … from './scratchMirrorLib.ts'`, `node:sqlite` and `import { z } from 'zod'` all resolving, `import.meta.dirname` resolving a `../src-tauri/tauri.dev.conf.json` read, `process.exitCode = 3` giving exit status 3, and nothing on stderr]

Type stripping needs no flag on this Node line and prints no warning.

## A `.ts` file run directly as `node <file>.ts` on Node v24.21.0 fails with `ERR_MODULE_NOT_FOUND` on a relative import written without its `.ts` extension

**Verified at:** Node v24.21.0, run 2026-10-20
**Citation:** [spec-writer_8: ran `node dev-data-server/scratchA.ts` from `app/`, where `scratchA.ts` held `import { a } from './scratchB'` and `scratchB.ts` existed — observed `ERR_MODULE_NOT_FOUND: Cannot find module '…/dev-data-server/scratchB' imported from …/scratchA.ts` and exit status 1]

Vite's config bundler and Vitest resolve the same extensionless specifier, so the two import styles coexist in one folder only when the Node-run files carry the extension.

## `os.homedir()` returns the value of the `HOME` environment variable on macOS when it is set

**Verified at:** Node v24.21.0, run 2026-10-20
**Citation:** [spec-writer_2: ran `HOME=/tmp/fakehome node dev-data-server/scratchHome.ts` from `app/` — observed `/tmp/fakehome` printed by `console.log(homedir())`]

A child process started with `HOME` set to a temporary directory therefore resolves every `homedir()`-based path under that directory.

## On a `node:sqlite` `DatabaseSync`, `ATTACH DATABASE ? AS dev` with the path bound reads a WAL database whose `-wal` file was never checkpointed

**Verified at:** Node v24.21.0, run 2026-10-20
**Citation:** [spec-writer_3: ran `node dev-data-server/scratchMirrorEntry.ts` from `app/` — observed a copied `devcopy.db` plus `devcopy.db-wal` (no `-shm`) attached, an `INSERT INTO main.paired_devices (…) SELECT … FROM dev.paired_devices` carrying both WAL-held rows, and `devcopy.db-wal` gone from the directory after `DETACH DATABASE dev` and `close()`]

The attach recovers the dev database's `-wal` rows into the read. The attached file's `-wal` was removed once the connection closed.

## In `node:sqlite`, `SELECT name FROM pragma_table_info(?, ?)` with the table and the schema name bound lists the columns of that table in `main` or in an attached database

**Verified at:** Node v24.21.0, run 2026-10-20
**Citation:** [spec-writer_9: ran `node dev-data-server/scratchMirrorEntry.ts` from `app/` — observed `pragma_table_info('paired_devices', 'main')` and `('paired_devices', 'dev')` returning each side's column names, whose intersection was `id,name,created_at,updated_at` while the dev side held an extra column]

The result rows carry a `name` field per column.
