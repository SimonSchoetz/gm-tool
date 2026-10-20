# SQLite

## PRAGMA recursive_triggers defaults to OFF and governs only self-recursion, not cross-table trigger firing

**Verified at:** sqlite.org current docs, fetched 2026-07-12
**Citation:** [spec-writer_1: https://www.sqlite.org/pragma.html#pragma_recursive_triggers]

"Support for recursive triggers was added in version 3.6.18 but was initially turned OFF by default, for compatibility." The setting controls a trigger re-invoking itself; a statement inside a trigger body that writes a different table fires that table's triggers regardless.

## Foreign key ON DELETE CASCADE fires the child table's DELETE triggers, before the parent's AFTER DELETE trigger

**Verified at:** SQLite 3.46.0 (the libsqlite3-sys 0.30.1 amalgamation) and 3.51.3 (node:sqlite), run 2026-09-19
**Citation:** [review-decision_6: compiled ~/.cargo/registry/src/index.crates.io-1949cf8c6b5b557f/libsqlite3-sys-0.30.1/sqlite3/sqlite3.c into a probe running `PRAGMA foreign_keys=on`, a parent `p` and a child `c REFERENCES p(id) ON DELETE CASCADE`, an AFTER DELETE trigger on each inserting into a log table, then `DELETE FROM p` — observed log `c:10` then `p:1` and no child rows left; same result with node:sqlite 3.51.3]

Every row a cascade deletes runs the child table's own DELETE triggers, so a change-tracking trigger on a child table records one row per cascade-deleted child, ahead of the parent's AFTER DELETE record. The five-step sequence on SQLite's foreign-keys page (`https://www.sqlite.org/foreignkeys.html`) (BEFORE triggers, local constraints, parent row change, FK actions, AFTER triggers) lists the parent's own triggers and says nothing that exempts the child's.

## strftime('%Y-%m-%dT%H:%M:%fZ','now') produces an ISO 8601 UTC string matching JS toISOString()

**Verified at:** sqlite.org current docs, fetched 2026-07-12
**Citation:** [spec-writer_4: https://www.sqlite.org/lang_datefunc.html — "%f — fractional seconds: SS.SSS"; "Universal Coordinated Time (UTC) is used" for 'now']

`%f` substitutes the entire seconds component with milliseconds (`SS.SSS`), so the format string above yields `YYYY-MM-DDTHH:MM:SS.SSSZ` — byte-identical in shape to JavaScript's `Date.prototype.toISOString()`, making the two lexicographically comparable.

## A CREATE TRIGGER statement's BEGIN...END body is one statement to SQLite's parser, safe to pass as a single db.execute() call

**Verified at:** sqlite.org current docs; tauri-plugin-sql 2.4.0 + sqlx-sqlite 0.8.6 source, fetched/read 2026-07-18
**Citation:** [implementer_2: https://www.sqlite.org/lang_createtrigger.html — semicolons inside BEGIN...END terminate the inner statements, not the outer CREATE TRIGGER statement, which is terminated by the final semicolon after END; I_3: C:\Users\simon\.cargo\registry\src\index.crates.io-1949cf8c6b5b557f\tauri-plugin-sql-2.4.0\src\wrapper.rs:146-171 — `execute()` passes the query string verbatim into a single `sqlx::query(&_query)`, no manual semicolon-splitting; I_4: C:\Users\simon\.cargo\registry\src\index.crates.io-1949cf8c6b5b557f\sqlx-sqlite-0.8.6\src\connection\execute.rs:21-40 — statement boundaries are determined by SQLite's own `prepare_next` (backed by `sqlite3_prepare_v2`), not string splitting]

A `CREATE TRIGGER trg AFTER INSERT ON t BEGIN stmt1; stmt2; END;` string passed whole to `db.execute()` (tauri-plugin-sql) is parsed by SQLite as exactly one statement — the inner semicolons never cause premature termination. Passing one such string per `db.execute()` call is safe; no special multi-statement handling is required as long as each call's SQL is a single complete top-level statement (which a full CREATE TRIGGER definition is, however many semicolons its body contains).

## SQLite's ALTER TABLE supports no IF NOT EXISTS modifier on ADD COLUMN

**Verified at:** sqlite.org current docs, fetched 2026-08-06
**Citation:** [refine-claude_1: https://sqlite.org/lang_altertable.html — the four supported alterations are RENAME TO, RENAME COLUMN, ADD COLUMN, DROP COLUMN; no IF NOT EXISTS / IF EXISTS modifier appears in the ADD COLUMN syntax diagram]

Unlike `CREATE TABLE IF NOT EXISTS` and `DROP TABLE IF EXISTS`, a column addition has no conditional-existence form — re-running `ALTER TABLE t ADD COLUMN c` against a table that already has `c` is an error, and statement-level idempotency cannot be expressed in the SQL itself.

## sqlx's connection-pool rollback-on-release safety net only covers transactions opened via its own API, not raw-SQL BEGIN sent through execute()

**Verified at:** sqlx-core 0.8.6, sqlx-sqlite 0.8.6, read 2026-08-27
**Citation:** [architect_5: ~/.cargo/registry/.../sqlx-core-0.8.6/src/transaction.rs:264-274 — a `Transaction` opened via `Connection::begin()` gets an automatic rollback queued on `Drop`, even when the connection returns to a pool; architect_6: ~/.cargo/registry/.../sqlx-sqlite-0.8.6/src/connection/mod.rs:556 — `in_transaction()` (backed by the real `sqlite3_get_autocommit` C API) has zero callers anywhere in the crate]

If a raw `'BEGIN'` string is executed via `Executor::execute()` (as opposed to `Connection::begin()`) and a later statement in the same logical "transaction" fails before a matching `COMMIT`/`ROLLBACK`, the physical connection is returned to the pool still inside an open transaction, with no cleanup mechanism — the next unrelated query that happens to reuse that connection would silently execute inside the stale transaction. Raw-SQL `BEGIN`/`COMMIT` sent as separate `execute()` calls cannot be made safe by any batching of calls; only sqlx's own `Connection::begin()`/`Transaction` API gets the drop-triggered rollback.

## sqlx-sqlite supports multiple `;`-separated top-level statements in a single query string passed to one execute()/select() call

**Verified at:** sqlx-sqlite 0.8.6, read 2026-08-27
**Citation:** [architect_7: ~/.cargo/registry/.../sqlx-sqlite-0.8.6/src/connection/execute.rs:8-19 — `VirtualStatement`/`ExecuteIter` tracks `args_used` to distribute bind parameters across statements in order; architect_8: sqlx-sqlite-0.8.6/src/migrate.rs:145 — sqlx's own native migrator relies on this, running an entire multi-statement migration script via one `tx.execute(&*migration.sql)` call]

A single JS-side `db.execute()` call (via tauri-plugin-sql) can safely contain multiple `;`-separated SQL statements with parameters correctly distributed across them — this closes the statement-splitting gap for a migration with no data-dependent branching between statements, though it does not by itself restore transaction safety (see the raw-SQL BEGIN entry above) and doesn't help a migration that reads a row and branches in JS before issuing further statements.

## SQLite's ON CONFLICT target requires the constraint to already exist at prepare time

**Verified at:** sqlite.org current docs, fetched 2026-08-27
**Citation:** [architect_9: https://www.sqlite.org/lang_upsert.html — "UPSERT processing happens only for uniqueness constraints... an explicit UNIQUE or PRIMARY KEY constraint within the CREATE TABLE statement, or a unique index"; empirically confirmed via sqlite3 CLI in this repo: `INSERT ... ON CONFLICT(col) DO NOTHING` against a table with no unique constraint on `col` fails with "Error: in prepare, ON CONFLICT clause does not match any PRIMARY KEY or UNIQUE constraint"]

A migration that both adds a row with `ON CONFLICT(col) DO NOTHING` and creates the `UNIQUE`/`PRIMARY KEY` constraint enabling that conflict target must create the constraint in an earlier-ordered migration, never the same or a later one — since migrations run in strict ascending timestamp order, a later-numbered constraint-creating migration cannot retroactively make an earlier `ON CONFLICT` clause valid on a fresh install.

## sqlx-sqlite binds a reused `$N` placeholder by parameter number, not by occurrence order

**Verified at:** sqlx-sqlite 0.8.6, read 2026-08-27
**Citation:** [architect_10: ~/.cargo/registry/.../sqlx-sqlite-0.8.6/src/arguments.rs:78-120 — `SqliteArguments::bind()` iterates `1..=handle.bind_parameter_count()` (SQLite's own distinct-parameter count via `sqlite3_bind_parameter_count`) and parses the numeral out of each parameter's own name to index into the values array]

Reusing the same `$N` placeholder more than once in a single query string (e.g. `$2` appearing in both a `SELECT` list and a `WHERE NOT EXISTS` clause) is safe — SQLite deduplicates same-numbered parameters at the C level, and sqlx binds by parsing each occurrence's own numeral rather than assuming sequential/positional order, so one values-array element correctly supplies every occurrence.

## SQLite disables foreign key enforcement per connection by default, but sqlx enables it by default

**Verified at:** sqlite.org current docs + sqlx latest docs, fetched 2026-07-12
**Citation:** [spec-writer_3: https://www.sqlite.org/foreignkeys.html — "Foreign key constraints are disabled by default (for backwards compatibility)"; https://docs.rs/sqlx/latest/sqlx/sqlite/struct.SqliteConnectOptions.html — "SQLx chooses to enable this by default so that foreign keys function as expected"]

tauri-plugin-sql connects through sqlx, so this app's SQLite connections have `foreign_keys = ON` — FK CASCADE/SET NULL actions are active.

## An INSERT ... SELECT carrying an ON CONFLICT upsert clause needs a WHERE clause in its SELECT, even `WHERE true`, and the conflict decision is made per row

**Verified at:** sqlite.org current docs (UPSERT added in 3.24.0), fetched 2026-09-13
**Citation:** [spec-writer_1: https://www.sqlite.org/lang_upsert.html — section 2.2: "the SELECT statement should always include a WHERE clause, even if that WHERE clause is just 'WHERE true'"; "the upsert decision is made separately for each row of the insert"]

Without a WHERE clause the parser cannot tell whether `ON` introduces the upsert or a join constraint, so `INSERT INTO t1 SELECT * FROM t2 ON CONFLICT(x) DO NOTHING` is ambiguous; `INSERT INTO t1 SELECT * FROM t2 WHERE true ON CONFLICT(x) DO NOTHING` is the safe form. For a multi-row INSERT ... SELECT, each row independently takes the DO NOTHING / DO UPDATE path.

## `sqlite_master` is a recognized name for the schema table, which holds one row per table, index, view, and trigger

**Verified at:** sqlite.org current docs, fetched 2026-09-13
**Citation:** [spec-writer_2: https://www.sqlite.org/schematab.html — "The sqlite_schema table contains one row for each table, index, view, and trigger"; "sqlite_master" listed as an alternative name that works anywhere]

`SELECT name FROM sqlite_master WHERE type = 'table' AND name = $1` returns one row exactly when an ordinary table of that name exists, and zero rows once it has been dropped — usable as an existence guard before a statement that would otherwise fail against a missing table.

## ALTER TABLE DROP COLUMN exists since SQLite 3.35.0, has no IF EXISTS form, and fails when the column is referenced elsewhere in the schema

**Verified at:** sqlite.org current docs, fetched 2026-09-18
**Citation:** [spec-writer_1: https://www.sqlite.org/releaselog/3_35_0.html — "Added support for ALTER TABLE DROP COLUMN"; https://www.sqlite.org/lang_altertable.html — "The DROP COLUMN command only works if the column is not referenced by any other parts of the schema and is not a PRIMARY KEY and does not have a UNIQUE constraint"]

The drop fails if the column is a PRIMARY KEY, has a UNIQUE constraint, is indexed, appears in a partial index's WHERE, a CHECK constraint, a foreign key, a generated column, a trigger, or a view. With no `IF EXISTS` form, a re-runnable migration guards the drop with a `PRAGMA table_info` check.

## This app's SQLite engine is the 3.46.0 amalgamation bundled by libsqlite3-sys 0.30.1

**Verified at:** libsqlite3-sys 0.30.1, sqlx 0.8.6 (Cargo.lock), read 2026-09-18
**Citation:** [spec-writer_2: ~/.cargo/registry/src/index.crates.io-1949cf8c6b5b557f/libsqlite3-sys-0.30.1/sqlite3/sqlite3.h:149 — `#define SQLITE_VERSION "3.46.0"`; ~/.cargo/registry/src/index.crates.io-1949cf8c6b5b557f/sqlx-0.8.6/Cargo.toml:478-481 — `sqlite = ["_sqlite", "sqlx-sqlite/bundled", ...]`]

tauri-plugin-sql enables sqlx's `sqlite` feature, which turns on `bundled`, so the engine version is the vendored amalgamation's rather than the OS's system SQLite. Any SQL feature introduced at or before 3.46.0 is available.

## TYPE, CONTENT, and CHECKED are not SQLite keywords and are usable as unquoted column names

**Verified at:** sqlite.org current docs, fetched 2026-09-18
**Citation:** [spec-writer_3: https://www.sqlite.org/lang_keywords.html — none of the three appear in the 147-element keyword list]

A column named `type`, `content`, or `checked` needs no quoting in `CREATE TABLE` or DML.

## An `ON DELETE SET NULL` foreign-key action fires the child table's AFTER UPDATE trigger, before the parent's AFTER DELETE trigger, and changes no other column

**Verified at:** SQLite 3.46.0 (the libsqlite3-sys 0.30.1 amalgamation) and 3.51.3 (node:sqlite), run 2026-09-19
**Citation:** [sync-behavior_22: compiled the libsqlite3-sys 0.30.1 amalgamation and ran node:sqlite, each with a parent table, a child whose FK has `ON DELETE SET NULL`, and logging triggers on both — observed `ent-update:e1:NULL` logged before `img-delete:i1` and the child's `updated_at` unchanged]

A change-tracking UPDATE trigger on the child records a change for every row the action nulls, while the row's own `updated_at` stays at its old value.

## A non-numeric TEXT value written to an INTEGER-affinity column of a table without `STRICT` is stored as TEXT

**Verified at:** sqlite.org current docs, fetched 2026-10-19; SQLite 3.53.4 (node:sqlite, Node 24.21.0), run 2026-10-19
**Citation:** [harness-follow-ups_1: https://www.sqlite.org/datatype3.html — Section 3, "If the TEXT value is not a well-formed integer or real literal, then the value is stored as TEXT", and INTEGER affinity "behaves the same as a column with NUMERIC affinity"] [harness-follow-ups_2: ran node:sqlite with `CREATE TABLE t (deleted INTEGER NOT NULL DEFAULT 0, label TEXT)` and inserted `('yes', 5)` — observed `deleted: 'yes'` with `typeof(deleted)` `text`]

A `NOT NULL` INTEGER column therefore accepts `'yes'` and reads it back as a JS string, which is how a test can seed a row that fails a `z.number()` field without any schema change.

## sqlx 0.8.6's `Sqlite::create_database` creates the database in WAL mode while `CREATE_DB_WAL` holds its default `true`

**Verified at:** sqlx-sqlite 0.8.6 (Cargo.lock) — 2026-10-20
**Citation:** [migration-backup_4: ~/.cargo/registry/src/index.crates.io-1949cf8c6b5b557f/sqlx-sqlite-0.8.6/src/lib.rs:125 — `pub static CREATE_DB_WAL: AtomicBool = AtomicBool::new(true);`; src/migrate.rs:20-38 — `create_database` adds `journal_mode(SqliteJournalMode::Wal)` while `CREATE_DB_WAL` is set] [migration-backup_5: ran a scratch crate on sqlx 0.8.6 that made a database with `Sqlite::create_database` and queried `PRAGMA journal_mode` through `SqlitePool::connect` — observed `wal`]

## A database that sqlx 0.8.6 created in WAL mode reported `wal` again when reopened with `SqlitePool::connect` after every connection to it had closed

**Verified at:** sqlx 0.8.6, SQLite 3.46.0, tauri-plugin-sql 2.5.0 — 2026-10-20
**Citation:** [migration-backup_19: ran a scratch crate on sqlx 0.8.6 that made a database with `Sqlite::create_database`, wrote to it through a `SqlitePool`, closed the pool, after which no `-wal` file remained, and connected again with `SqlitePool::connect` on the same URL — observed `PRAGMA journal_mode` = `wal`] [migration-backup_22: ~/.cargo/registry/src/index.crates.io-1949cf8c6b5b557f/sqlx-sqlite-0.8.6/src/options/mod.rs:177-181 — connect options leave the `journal_mode` pragma unset unless the caller requests one] [migration-backup_20: ~/.cargo/registry/src/index.crates.io-1949cf8c6b5b557f/tauri-plugin-sql-2.5.0/src/commands.rs:19 — the `load` command calls `DbPool::connect`; src/wrapper.rs:101 — which connects with `Pool::connect(conn_url)`, passing no options beyond the URL] [migration-backup_21: ran `sqlite3 -readonly "$HOME/Library/Application Support/com.gm-tool.dev/gm_tool.db" "PRAGMA journal_mode"` on the database the app's dev build had created through tauri-plugin-sql — observed `wal`]

tauri-plugin-sql reconnects that way on every `load`, so a database it created through `Sqlite::create_database` (`tauri.md`, the entry beginning "tauri-plugin-sql 2.5.0 opens a `sqlite:<file>` database") stays in WAL mode.

## While a sqlx pool held a WAL database open after 500 inserts, a copy of the main file alone held no tables

**Verified at:** sqlx 0.8.6, SQLite 3.46.0 — 2026-10-20
**Citation:** [migration-backup_6: ran a scratch crate on sqlx 0.8.6 that made `gm_tool.db` with `Sqlite::create_database`, created a table and inserted 500 rows through an open `SqlitePool`, then, with the pool still open, copied only `gm_tool.db` into another directory and listed the tables in the copy's `sqlite_master` — observed an empty list, with the main file at 4096 bytes and `gm_tool.db-wal` at 2080632 bytes]

## `VACUUM INTO $1`, with the target path bound as a string through sqlx on SQLite 3.46.0, wrote a complete single-file copy of a WAL database that a sqlx pool held open

**Verified at:** sqlx 0.8.6, SQLite 3.46.0, tauri-plugin-sql 2.5.0, @tauri-apps/plugin-sql 2.5.0 — 2026-10-20
**Citation:** [migration-backup_7: https://www.sqlite.org/lang_vacuum.html — "The filename in the INTO clause can be an arbitrary SQL expression that evaluates to a string", and the output "is a consistent snapshot of the original database"] [migration-backup_8: ran a scratch crate on sqlx 0.8.6 that made `gm_tool.db` with `Sqlite::create_database` and inserted 500 rows through an open `SqlitePool`, and, with the pool still open and `SELECT sqlite_version()` returning `3.46.0`, ran `sqlx::query("VACUUM INTO $1").bind(<path>).execute(&pool)` — observed `Ok`, then in the copy `count(*)` = 500, `PRAGMA journal_mode` = `delete` and `PRAGMA integrity_check` = `ok`, with no `-wal` file beside it] [migration-backup_9: `app/node_modules/@tauri-apps/plugin-sql/dist-js/index.js:125-130` — `execute(query, bindValues)` invokes `plugin:sql|execute` with `values: bindValues ?? []`; ~/.cargo/registry/src/index.crates.io-1949cf8c6b5b557f/tauri-plugin-sql-2.5.0/src/commands.rs:57-66 — the command hands `values: Vec<JsonValue>` to the pool wrapper's `execute`; src/wrapper.rs:164-176 — which binds a JSON string with `query.bind(value.as_str().unwrap().to_owned())` and runs `pool.execute(query)`]

The probe's call is the one tauri-plugin-sql 2.5.0 makes for `db.execute('VACUUM INTO $1', [path])` with a string `path`.

## `VACUUM INTO` fails with `output file already exists` on a target holding an earlier copy, accepts an empty file or a path where no file exists, and fails with `unable to open database` for a target in a missing directory

**Verified at:** SQLite 3.46.0 (via sqlx 0.8.6) — 2026-10-20
**Citation:** [migration-backup_10: https://www.sqlite.org/lang_vacuum.html — "The file named by the INTO clause must not previously exist, or else it must be an empty file, or the VACUUM INTO command will fail with an error."] [migration-backup_11: ran a scratch crate on sqlx 0.8.6 that ran `VACUUM INTO $1` through an open `SqlitePool` on a database it made with `Sqlite::create_database` — observed `SqliteError { code: 1, message: "output file already exists" }` for a target holding an earlier copy, `Ok` for an existing empty file and for a path where no file existed, and `code: 14` with `unable to open database: <path>` for a target in a missing directory]

## A `VACUUM INTO` interrupted by an unplanned shutdown or power loss can leave an incomplete, corrupt output file

**Verified at:** <https://www.sqlite.org/lang_vacuum.html> — 2026-10-20
**Citation:** [migration-backup_12: https://www.sqlite.org/lang_vacuum.html — "if the VACUUM INTO command is interrupted by an unplanned shutdown or power loss, then the generated output database might be incomplete and corrupt"]

## A WAL database's `-wal` and `-shm` files exist while any connection holds it open, are checkpointed and deleted when the last connection closes, can be left behind by a crash or `SQLITE_FCNTL_PERSIST_WAL`, and must be copied along with the main file

**Verified at:** <https://www.sqlite.org/wal.html>, 2026-10-20
**Citation:** [architect_16: <https://www.sqlite.org/wal.html> — sections 4, 5 and 6] [code-reviewer_3: ran a scratch node probe under Node v24.21.0 that copied a WAL database together with its -wal and -shm with no live connection, opened it with `DatabaseSync`, ran `VACUUM INTO` a second path and closed — observed the listing `[gm_tool.db, -shm, -wal]` before and `[gm_tool.db]` after, and the main file's bytes changed] [implement_8: ran `npx vitest run dev-data-server/__tests__/installedAppData.test.ts` from `app/` — observed the case "copies the rows of a database left with its -wal and -shm files and, as the only connection, checkpoints them into the source on close" passing: the copy and the source both hold the row the -wal carried, and the source directory holds the main file alone afterwards]

A `-wal` file beside a database whose app is closed means the last connection did not checkpoint, so a copy of the main file alone misses the committed rows still in the WAL; the presence of the file is the signal to copy through SQLite rather than by file. A connection opened only to copy counts as a connection: when it is the only one, its close checkpoints the WAL into the main file and removes the two side files.

## A read-only open of a WAL database needs the `-shm` and `-wal` files to exist, or a writable directory, or the `immutable` query parameter

**Verified at:** <https://www.sqlite.org/wal.html>, 2026-10-20
**Citation:** [architect_16: <https://www.sqlite.org/wal.html> — sections 4, 5 and 6]

Opening a WAL database read-only in a directory the process cannot write to fails unless the two side files already exist or the open declares the file immutable.

## `VACUUM INTO` writes a consistent snapshot of the database into a target that must not exist or must be an empty file, leaves the original unchanged, and is documented as an alternative to the backup API

**Verified at:** <https://www.sqlite.org/lang_vacuum.html>, 2026-10-20; node:sqlite under Node v24.21.0 (SQLite 3.53.4), run 2026-10-20
**Citation:** [architect_17: <https://www.sqlite.org/lang_vacuum.html>] [spec-writer_39: ran a scratch `node` probe in a temp directory: a `DatabaseSync` writer set `PRAGMA journal_mode = WAL`, created a table and inserted one row and stayed open; a second `DatabaseSync` on the same file ran `prepare('VACUUM INTO ?').run(<copy path>)` and closed — observed the directory holding `gm_tool.db`, `gm_tool.db-shm` and `gm_tool.db-wal` before and after the copy, the copy opened read-only holding the inserted row, and the `-wal` and `-shm` files gone once the writer closed] [implement_2: ran `npx vitest run dev-data-server/__tests__/installedAppData.test.ts` from `app/` at 88bc6ddd — observed the case "copies the committed rows a WAL writer still holds open" passing: a second connection's `VACUUM INTO` copy held both rows while the writer stayed open, with the source main file's bytes and the directory listing unchanged]

A copy taken with `VACUUM INTO` through a second connection to the source is complete even while another connection holds the source open in WAL mode with uncheckpointed rows, and the source's main file and directory are left as they were until the last connection closes.
