# Spec: Background Animation Toggle

## Progress Tracker

- SF1: Settings Table Migration — create `settings` table; insert `background` default row
- SF2: Settings DB Module — generic typed accessor (`getSetting` / `updateSetting`) with Zod schema registry
- SF3: Settings DAL Module — generic `useSetting` hook; update `data-access-layer` barrel
- SF4: Backdrop Wiring — read `animationEnabled` from `useSetting`; guard and gate beams
- SF5: AppearanceSection Wiring — wire existing toggle to `useSetting('background')`

## Key Architectural Decisions

### Unified `settings` table with a schema registry

A per-key module pattern (like `db/_system/versioning.ts`) requires a new schema file, accessor module, barrel export, and DAL hook for every new setting. Instead, a single `db/_settings/` module owns a Zod schema registry keyed by setting ID. `SettingsKey` is a union of all registered keys; `SettingsValueMap` is a mapped type from key to its value shape. Adding a new setting requires only a new schema entry in the registry and a migration — no new files. The `_system` table and `versioning.ts` are not modified or removed.

### `value TEXT NOT NULL` on the `settings` table

Every row in `settings` is inserted by a migration with a complete JSON value; the column is never legitimately null at the SQL level. The DB accessor still returns `T | null` (null = row not found), which is a JavaScript-level distinction signalling the missing-row case.

### No service layer

Settings reads and writes have no business logic, no domain error transformation, and no composition with other tables. The DAL (`useSetting`) calls `db/_settings/` directly, matching the existing `_system` accessor pattern.

### `null` merges "loading" and "row not found"

`useSetting` returns `value: SettingsValueMap[K] | null`. TanStack Query's `data` is `undefined` while loading; the hook collapses `undefined` to `null` via `data ?? null`. In practice the settings row always exists (inserted by migration), so `null` only occurs during the brief initial loading window. Consumers apply per-setting defaults for display (e.g. `value?.animation_enabled ?? true`).

### `animationEnabled` in `useEffect` deps triggers Pixi reinit

`Backdrop` is globally mounted in `AppContent` and never unmounts. When the user toggles the setting, query invalidation updates `animationEnabled`, the effect cleanup destroys the existing Pixi instance, and the effect re-runs with the new value. This is the correct reactive path — there is no lighter alternative that handles a globally mounted canvas.

### Grid renders even when animation is disabled

Pixi initialises with the `TilingSprite` (grid) regardless of `animationEnabled`. When `animationEnabled` is `false`, the `init` function returns after the grid setup, skipping beam render texture, beam sprite, ticker callback, and `spawnAllBeams()`. The `handleResize` handler must not gate the grid resize path on `beamSprite` being non-null; the beam resize block runs only when the beam objects are present.

### TypeScript generic inference on `useSetting`

`useSetting<K extends SettingsKey>(key: K)` infers `K` from the string literal at the call site. The return type `{ value: SettingsValueMap[K] | null; update: (value: SettingsValueMap[K]) => void }` resolves to the specific value shape for that key. This requires `settingsSchemas` to be declared `as const` so TypeScript can index into it by literal key. A cast `as SettingsValueMap[K]` is required when returning `schema.parse(...)` because TypeScript cannot prove the parse result is the indexed type.

## Sub-feature Files

- [SF1 — Settings Table Migration](SPEC_BG_ANIMATION_TOGGLE_SF1.md)
- [SF2 — Settings DB Module](SPEC_BG_ANIMATION_TOGGLE_SF2.md)
- [SF3 — Settings DAL Module](SPEC_BG_ANIMATION_TOGGLE_SF3.md)
- [SF4 — Backdrop Wiring](SPEC_BG_ANIMATION_TOGGLE_SF4.md)
- [SF5 — AppearanceSection Wiring](SPEC_BG_ANIMATION_TOGGLE_SF5.md)

## CLAUDE.md Impact

`app/docs/_product/domain-scaffold.md` — add a section documenting the `settings` infrastructure as an ambient system: the `db/_settings/` module is the source of truth for all persistent app settings; new settings are added by registering a Zod schema in `db/_settings/schema.ts` and adding a migration that inserts the default row. Any feature that reads or writes a user-facing app preference must go through `useSetting` in `src/data-access-layer/settings/`.
