# Spec: App Auto-Update

## Progress Tracker

- SF1: `_system` DB module — get/set key-value API + table bootstrap in `database.ts`
- SF2: Tauri updater commands — `check_update` and `install_update` Rust commands + plugin wiring
- SF3: Updater domain, service, and DAL — errors, service, TanStack hooks, App.tsx auto-check
- SF4: Settings screen restructuring — extract `TableConfigSection` and `AppVersionSection`
- SF5: GitHub Actions + release infrastructure — pipeline, `CHANGELOG.md`, release process doc
- SF6: seedTableConfig migration — move seed data to migration, delete `seed.ts`

## Key Architectural Decisions

### `_system` table is exempt from domain column requirements

`_system` uses `key TEXT PRIMARY KEY, value TEXT` with no `id`, `created_at`, or `updated_at` columns.
Infrastructure tables prefixed with `_` are exempt from the domain entity column rule in `db/CLAUDE.md`
("All tables have at least id, created_at, updated_at"). This mirrors `_migrations`, which also omits
those columns. Adding surrogate keys or timestamps to a key-value lookup table would add noise with no
consumer.

### `db/_system/` uses `get`/`set` instead of CRUD naming

The standard db naming convention (`create`, `get`, `getAll`, `update`, `remove`) assumes entity tables
with separate create and update semantics. A key-value store with upsert semantics has no meaningful
create/update distinction — `set` accurately names the single write operation. This is a deliberate,
narrow deviation from the naming convention; all other domain modules continue using standard names.

### `_system` table bootstrapped inline in `database.ts`

`_system` is infrastructure, not a domain entity. Its `CREATE TABLE IF NOT EXISTS` and the seed row
`('versioning', null)` live inline in `database.ts` immediately after `_migrations` is bootstrapped.
No `seed.ts` file is introduced for `_system`. This keeps all infrastructure initialization in one
place and ensures `_system` is always available regardless of migration state — the same reason
`_migrations` is bootstrapped inline rather than through the migration system.

### `getAppVersion` does not go through the service layer

`getVersion()` from `@tauri-apps/api/app` is a Tauri metadata API with a fixed return type and no
meaningful error case. It is called directly inside `useAppVersion` in the DAL, bypassing the service
layer. The service convention ("wrap DB calls, apply business rules, throw typed domain errors") does
not apply: there is no business rule, no DB call, and no realistic error path.

### Update check is a `useQuery` with `staleTime: Infinity`

`check_update` is auto-triggered once on app start (called in `App.tsx`) and re-triggered on Settings
screen button click. TanStack Query's shared cache deduplicates: `App.tsx` populates the cache;
`AppVersionSection` reads the cached value and exposes `refetch()` wrapped as `checkUpdate()`.
`staleTime: Infinity` prevents background auto-refetch between explicit checks.

### `throwOnError: true` on `useCheckUpdate` follows project convention

The project requires `throwOnError: true` on all `useQuery` calls. A failed update check (e.g., no
network) surfaces to the Error Boundary. This is acceptable for a personal app. Do not deviate
from this convention to suppress update check failures silently.

### Two separate Tauri commands: `check_update` and `install_update`

`check_update` returns the available version string (or `null` if up to date) for display in the UI.
`install_update` re-checks and downloads + installs the update, triggering an app restart.
Separating them allows the UI to show the available version before the user commits to installing.

### Settings screen sub-components follow the directory pattern

`TableConfigSection` and `AppVersionSection` each live in their own directory under
`src/screens/settings/components/`, matching the existing `TableConfigRow/` pattern. Each directory
contains a `.tsx` and a `.css` file. No sub-directory `index.ts` is needed unless a component gains
its own `helper/` or `components/` sub-structure.

### seedTableConfig seed data moves to a migration (SF6)

The `seedTableConfig` pattern is legacy: it reimplements what the migration system already does
(run once per install). SF6 replaces it with a migration that inserts the same rows via
`INSERT OR IGNORE`. New domain tables must not introduce seed files — initial data goes in the
migration that creates the table.

### CHANGELOG.md follows Keep a Changelog format

No tooling dependency. Claude updates `CHANGELOG.md` before each release: move `[Unreleased]`
entries to a new versioned section, classified by conventional commit type
(feat → Added, fix → Fixed, refactor/perf → Changed, chore with visible effect → Changed).
Tag format is `v1.0.0` (GitHub convention).

## Sub-Feature Files

- [SF1: `_system` DB module](SPEC_APP_AUTO_UPDATE_SF1.md)
- [SF2: Tauri updater commands](SPEC_APP_AUTO_UPDATE_SF2.md)
- [SF3: Updater domain, service, and DAL](SPEC_APP_AUTO_UPDATE_SF3.md)
- [SF4: Settings screen restructuring](SPEC_APP_AUTO_UPDATE_SF4.md)
- [SF5: GitHub Actions + release infrastructure](SPEC_APP_AUTO_UPDATE_SF5.md)
- [SF6: seedTableConfig migration](SPEC_APP_AUTO_UPDATE_SF6.md)

## CLAUDE.md Impact

**`app/db/CLAUDE.md`** — Under the column conventions section, add:

> Infrastructure tables prefixed with `_` (e.g., `_migrations`, `_system`) are exempt from the
> domain column requirements (`id`, `created_at`, `updated_at`). They define their own schema to
> match their structural purpose.

**`app/db/CLAUDE.md`** — Under the Seeds section, add:

> With the migration system in place, initial data rows for new domain tables belong in the migration
> that creates the table — not in a separate `seed.ts` file. The `seedTableConfig` pattern is legacy.
> Do not replicate it for new tables.

**`app/db/CLAUDE.md`** — Under Structure, add `_system/` to the directory listing:

> `├── _system/` — key TEXT PRIMARY KEY, value TEXT (JSON); infrastructure key-value store

**`app/docs/domain-scaffold.md`** — This file does not yet exist. Creating it is out of scope for
this spec. When it is created in the future, it should document `_system` (infrastructure
key-value table), `domain/updater/` (error types for update check and install), and
`data-access-layer/updater/` (useAppVersion, useCheckUpdate, useInstallUpdate).
