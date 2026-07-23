# SQLite

## PRAGMA recursive_triggers defaults to OFF and governs only self-recursion, not cross-table trigger firing

**Verified at:** sqlite.org current docs, fetched 2026-07-12
**Citation:** [S_1: https://www.sqlite.org/pragma.html#pragma_recursive_triggers]

"Support for recursive triggers was added in version 3.6.18 but was initially turned OFF by default, for compatibility." The setting controls a trigger re-invoking itself; a statement inside a trigger body that writes a different table fires that table's triggers regardless.

## Foreign key ON DELETE CASCADE does not fire the child table's DELETE triggers

**Verified at:** sqlite.org current docs, fetched 2026-07-12
**Citation:** [S_2: https://www.sqlite.org/foreignkeys.html]

FK actions run as step 4 of the parent-modification sequence, separate from trigger execution (steps 1 and 5 run the parent's triggers). Cascade-deleted child rows therefore produce no trigger side effects — change-tracking triggers only capture directly-deleted rows.

## strftime('%Y-%m-%dT%H:%M:%fZ','now') produces an ISO 8601 UTC string matching JS toISOString()

**Verified at:** sqlite.org current docs, fetched 2026-07-12
**Citation:** [S_4: https://www.sqlite.org/lang_datefunc.html — "%f — fractional seconds: SS.SSS"; "Universal Coordinated Time (UTC) is used" for 'now']

`%f` substitutes the entire seconds component with milliseconds (`SS.SSS`), so the format string above yields `YYYY-MM-DDTHH:MM:SS.SSSZ` — byte-identical in shape to JavaScript's `Date.prototype.toISOString()`, making the two lexicographically comparable.

## A CREATE TRIGGER statement's BEGIN...END body is one statement to SQLite's parser, safe to pass as a single db.execute() call

**Verified at:** sqlite.org current docs; tauri-plugin-sql 2.4.0 + sqlx-sqlite 0.8.6 source, fetched/read 2026-07-18
**Citation:** [I_2: https://www.sqlite.org/lang_createtrigger.html — semicolons inside BEGIN...END terminate the inner statements, not the outer CREATE TRIGGER statement, which is terminated by the final semicolon after END; I_3: C:\Users\simon\.cargo\registry\src\index.crates.io-1949cf8c6b5b557f\tauri-plugin-sql-2.4.0\src\wrapper.rs:146-171 — `execute()` passes the query string verbatim into a single `sqlx::query(&_query)`, no manual semicolon-splitting; I_4: C:\Users\simon\.cargo\registry\src\index.crates.io-1949cf8c6b5b557f\sqlx-sqlite-0.8.6\src\connection\execute.rs:21-40 — statement boundaries are determined by SQLite's own `prepare_next` (backed by `sqlite3_prepare_v2`), not string splitting]

A `CREATE TRIGGER trg AFTER INSERT ON t BEGIN stmt1; stmt2; END;` string passed whole to `db.execute()` (tauri-plugin-sql) is parsed by SQLite as exactly one statement — the inner semicolons never cause premature termination. Passing one such string per `db.execute()` call is safe; no special multi-statement handling is required as long as each call's SQL is a single complete top-level statement (which a full CREATE TRIGGER definition is, however many semicolons its body contains).

## SQLite disables foreign key enforcement per connection by default, but sqlx enables it by default

**Verified at:** sqlite.org current docs + sqlx latest docs, fetched 2026-07-12
**Citation:** [S_3: https://www.sqlite.org/foreignkeys.html — "Foreign key constraints are disabled by default (for backwards compatibility)"; https://docs.rs/sqlx/latest/sqlx/sqlite/struct.SqliteConnectOptions.html — "SQLx chooses to enable this by default so that foreign keys function as expected"]

tauri-plugin-sql connects through sqlx, so this app's SQLite connections have `foreign_keys = ON` — FK CASCADE/SET NULL actions are active.
