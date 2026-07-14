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

## SQLite disables foreign key enforcement per connection by default, but sqlx enables it by default

**Verified at:** sqlite.org current docs + sqlx latest docs, fetched 2026-07-12
**Citation:** [S_3: https://www.sqlite.org/foreignkeys.html — "Foreign key constraints are disabled by default (for backwards compatibility)"; https://docs.rs/sqlx/latest/sqlx/sqlite/struct.SqliteConnectOptions.html — "SQLx chooses to enable this by default so that foreign keys function as expected"]

tauri-plugin-sql connects through sqlx, so this app's SQLite connections have `foreign_keys = ON` — FK CASCADE/SET NULL actions are active.
