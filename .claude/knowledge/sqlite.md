# SQLite

## PRAGMA recursive_triggers defaults to OFF and governs only self-recursion, not cross-table trigger firing

**Verified at:** sqlite.org current docs, fetched 2026-07-12
**Citation:** [spec-writer_1: https://www.sqlite.org/pragma.html#pragma_recursive_triggers]

"Support for recursive triggers was added in version 3.6.18 but was initially turned OFF by default, for compatibility." The setting controls a trigger re-invoking itself; a statement inside a trigger body that writes a different table fires that table's triggers regardless.

## Foreign key ON DELETE CASCADE fires the child table's DELETE triggers, before the parent's AFTER DELETE trigger

**Verified at:** SQLite 3.46.0 (the libsqlite3-sys 0.30.1 amalgamation) and 3.51.3 (node:sqlite), run 2026-09-19
**Citation:** [review-decision_6: compiled ~/.cargo/registry/src/index.crates.io-1949cf8c6b5b557f/libsqlite3-sys-0.30.1/sqlite3/sqlite3.c into a probe running `PRAGMA foreign_keys=on`, a parent `p` and a child `c REFERENCES p(id) ON DELETE CASCADE`, an AFTER DELETE trigger on each inserting into a log table, then `DELETE FROM p` — observed log `c:10` then `p:1` and no child rows left; same result with node:sqlite 3.51.3]

Every row a cascade deletes runs the child table's own DELETE triggers, so a change-tracking trigger on a child table records one row per cascade-deleted child, ahead of the parent's AFTER DELETE record. https://www.sqlite.org/foreignkeys.html's five-step sequence (BEFORE triggers, local constraints, parent row change, FK actions, AFTER triggers) lists the parent's own triggers and says nothing that exempts the child's.

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
