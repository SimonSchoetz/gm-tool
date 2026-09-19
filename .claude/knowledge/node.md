# Node.js

## `node:sqlite` loads without a flag on Node 22.23.2, bundles SQLite 3.51.3, and enables foreign keys by default

**Verified at:** Node v22.23.2, run 2026-09-19
**Citation:** [review-decision_1: ran `node -e` with `new DatabaseSync(':memory:')` — observed `sqlite_version()` 3.51.3, `PRAGMA foreign_keys` 1, and an `ExperimentalWarning` on stderr]

`DatabaseSync` from `node:sqlite` works with no `--experimental-sqlite` flag but still prints an experimental warning. Foreign key enforcement is on for a fresh in-memory database without any `PRAGMA`, matching sqlx's default, and its engine version differs from any SQLite a native dependency bundles.

## `node:sqlite` binds positional arguments to `?NNN` parameters by number, not by occurrence order

**Verified at:** Node v22.23.2 (SQLite 3.51.3), run 2026-09-19
**Citation:** [review-decision_2: ran `node -e` preparing `insert into t (b, a) values (?2, ?1)` and calling `.run('A-val', 'B-val')` — observed row `{ a: 'A-val', b: 'B-val' }`]

A `?N` parameter takes the N-th positional argument wherever it appears in the statement, so rewriting `$N` placeholders to `?N` keeps sqlx's bind-by-number semantics for the same values array.

## `DatabaseSync.prepare()` silently compiles only the first statement of a multi-statement string

**Verified at:** Node v22.23.2 (SQLite 3.51.3), run 2026-09-19
**Citation:** [review-decision_3: ran `node -e` with `db.prepare('create table a (x); create table b (y);').run()` — observed no error and only table `a` in `sqlite_master`]

Every statement after the first `;` is dropped without an error, unlike sqlx, which executes each top-level statement of one query string. `DatabaseSync.exec()` runs every statement but accepts no bind values.
