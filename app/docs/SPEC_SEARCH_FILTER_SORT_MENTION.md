# SPEC: @-Mention System

## Progress

- [x] Phase 1: Table Config System
- [x] Phase 2: Sortable Table Headers
- [x] Phase 3: List Filtering / Search
- [ ] Phase 4: @-Mention — Custom Lexical MentionNode
- [ ] Phase 5: @-Mention — Typeahead Popup
- [ ] Phase 6: Reference List (DEFERRED)

## Before anything else

Read all CLAUDE.md files!

## Purpose

Implement an @-mention system in all TextEditor fields to link entities (NPCs, sessions, etc.) with color-coded, clickable inline badges.

## Context

Phases 1–3 are complete. Key architectural facts for phases 4–6:

- **Data access layer:** `src/data-access-layer/table-config/` — use `useTableConfigs()` for all configs, `useTableConfig(id)` for a single config by ID. No `TableConfigProvider`, no `DataProvider` — hooks work directly inside `TanstackQueryClientProvider` (in `App.tsx`).
- **`TableConfig` type:** `{ id, table_name, color, tagging_enabled, scope, layout, created_at, updated_at }` where `layout` is a parsed JSON object: `{ searchable_columns, columns[], sort_state }`
- **No `display_name` column:** derive display labels from `table_name` via `formatTableLabel()` (see Phase 4)
- **`@lexical/link`** is already installed at `0.40.0`. All other Lexical packages are at `0.39.0` — align to `0.39.0` before starting Phase 4.

---

## Phase 4: @-Mention — Custom Lexical MentionNode

**Why first:** The node must exist before the typeahead popup can insert it.

### 4a. `formatTableLabel` util

- **File:** `src/util/formatTableLabel.ts`
- Maps `table_name` → human-readable label: `'npcs'` → `'NPC'`, `'sessions'` → `'Session'`, etc.
- Fallback for unknown tables: strip trailing `s`, capitalize first letter
- When adding a new table: one line in the map

```typescript
const labelMap: Record<string, string> = {
  npcs: 'NPC',
  sessions: 'Session',
  adventures: 'Adventure',
};

export const formatTableLabel = (tableName: string): string =>
  labelMap[tableName] ??
  tableName.charAt(0).toUpperCase() + tableName.slice(1, -1);
```

### 4b. Custom `MentionNode`

- **File:** `src/components/TextEditor/nodes/MentionNode.tsx`
- Extends `DecoratorNode` (not `LinkNode` — we need React rendering for color badge + click handling)
- Stored properties: `entityId`, `entityType` (= `table_name`), `displayName`, `color`, `adventureId?`
  - `adventureId` is optional: required for adventure-scoped entity navigation, omitted for global-scoped
- `decorate()` returns `<MentionBadge />` JSX
- `exportJSON()` / `importJSON()` / `getTextContent()` for serialization

### 4c. Register `MentionNode`

- Add `MentionNode` to `initialConfig.nodes` array in `TextEditor.tsx`
- Add mention-specific theme classes to the `theme` object

### 4d. `MentionBadge` component

- **File:** `src/components/TextEditor/components/MentionBadge.tsx`
- Renders: colored inline badge with entity name
- `color` comes from the node's `color` property (sourced from `table_config` at insertion time)
- On click: navigate via TanStack Router
  - Adventure-scoped: use `adventureId` + `entityType` + `entityId` to build route
  - Global-scoped: derive route from `entityType` alone

### Lexical notes

- Currently on **Lexical v0.39.0**
- No built-in `MentionNode` — must be custom
- `LexicalTypeaheadMenuPlugin` available from `@lexical/react` (already installed)
- Custom nodes registered via `initialConfig.nodes` — zero required constructor args

### Files to create/modify

- `src/util/formatTableLabel.ts` (new)
- `src/util/index.ts` (export `formatTableLabel`)
- `src/components/TextEditor/nodes/MentionNode.tsx` (new)
- `src/components/TextEditor/nodes/index.ts` (new barrel — export `MentionNode`)
- `src/components/TextEditor/components/MentionBadge.tsx` (new)
- `src/components/TextEditor/components/index.ts` (export `MentionBadge`)
- `src/components/TextEditor/TextEditor.tsx` (register node + theme classes)

---

## Phase 5: @-Mention — Typeahead Popup

**Why fifth:** Requires `MentionNode` (Phase 4).

### 5a. Mention search DB function

- **File:** `db/mention-search.ts`
- Cross-table concern — no single domain owns it, flat file at DB root is appropriate
- Single primitive: one parameterized SELECT against a given table — no orchestration, no iteration, no config awareness
- Signature: `searchByName(tableName: string, query: string, adventureId: string | null, limit?: number): Promise<{ id: string; name: string; updated_at: string }[]>`
  - `adventureId !== null`: appends `AND adventure_id = $adventureId` to the WHERE clause
  - `adventureId === null`: no adventure filter (global-scoped tables)
  - Always `ORDER BY updated_at DESC LIMIT $limit` — ordering at the DB level ensures the most recent rows are returned before the limit is applied
  - Returns raw rows only — no enrichment, no type beyond the row shape

### 5b. Mention search service

- **File:** `src/services/mentionSearchService.ts`
- Owns orchestration and the `MentionSearchResult` type — this is where config awareness lives, not the DB layer
- `MentionSearchResult` defined here: `{ id, name, tableName, color, adventureId? }`
  - `adventureId` included only for adventure-scoped results (stored in `MentionNode` for navigation)
- `searchMentions(query: string, adventureId: string, tableConfigs: TableConfig[]): Promise<MentionSearchResult[]>`
  - Iterates configs where `tagging_enabled === 1`
  - Calls `db/mention-search.searchByName(config.table_name, query, scope === 'adventure' ? adventureId : null)`
  - Enriches each row with `tableName` and `color` from the config
  - Returns a flat merged array ordered by `updated_at` across all tables

### 5c. `MentionTypeaheadPlugin`

- **File:** `src/components/TextEditor/plugins/MentionTypeaheadPlugin.tsx`
- Uses `LexicalTypeaheadMenuPlugin` from `@lexical/react`
- Trigger: `@` character
- Gets `tableConfigs` via `useTableConfigs()` directly — no provider needed
- On trigger: call `mentionSearchService.searchMentions(queryText, adventureId, tableConfigs)`
- `MentionSearchResult` imported from `src/services/mentionSearchService.ts`
- Popup renders each result as: `[ColorDot] EntityName [TableLabel]` where `TableLabel = formatTableLabel(result.tableName)`
- On select: insert `MentionNode` with `{ entityId, entityType, displayName, color, adventureId? }`, remove `@query` text
- Keyboard nav: arrow keys + Enter to select, Escape to dismiss
- Receives `adventureId` as prop from `TextEditor`

### 5d. Wire into `TextEditor`

- Add `adventureId?: string` prop to `TextEditor` (optional: if absent, only global-scoped entities appear)
- Add `<MentionTypeaheadPlugin adventureId={adventureId} />` inside `LexicalComposer`
- Update `NpcScreen` and `AdventureScreen` to pass `adventureId` (both already have it via `useParams`)

### Files to create/modify

- `db/mention-search.ts` (new)
- `src/services/mentionSearchService.ts` (new)
- `src/components/TextEditor/plugins/MentionTypeaheadPlugin.tsx` (new)
- `src/components/TextEditor/TextEditor.tsx` (add plugin + `adventureId?` prop)
- `src/screens/npc/NpcScreen.tsx` (pass `adventureId` to `TextEditor`)
- `src/screens/adventure/AdventureScreen.tsx` (pass `adventureId` to `TextEditor`)

---

## Phase 6: Reference List — DEFERRED

Deferred until Phases 4–5 are solid.

- **Preferred approach:** A `mentions` tracking table, populated on text save. `MentionNode` already stores `entityId` + `entityType` — the serialization shape is in place.
- **Alternative:** On-the-fly search across all text fields for the entity's ID (simpler, but slower and fragile)
- **Prerequisite:** `MentionNode` must be stable and in production use

---

## Maintainability: Adding a new table

1. **DB layer:** Create `db/newTable/` with standard CRUD
2. **Seed `table_config`:** One INSERT row — single source of truth for `color`, `tagging_enabled`, `scope`, `layout`
3. **`formatTableLabel`:** One line in `labelMap` (e.g. `factions: 'Faction'`)
4. **TextEditor:** No changes — `MentionTypeaheadPlugin` reads `table_config` dynamically

**Touch points for full @-mention support of a new table: 2 lines.**

---

## Verification Plan

### Phase 4

- Manually create a `MentionNode` in the editor → renders as colored badge
- Click badge → navigates to entity screen
- Save & reload → mention persists in serialized JSON

### Phase 5

- Type `@` in any `TextEditor` → popup appears with recent entities
- Type `@Gob` → filters to entities matching "Gob"
- Select item → `MentionNode` inserted with correct color and label
- Results show formatted table labels (`NPC`, `Session`, etc.)
- Adventure-scoped results only show entities from the current adventure

---

## Key Technical Decisions

| Decision | Choice | Rationale |
|---|---|---|
| Mention node type | `DecoratorNode` | Need React component for color badge + click handler |
| Display label source | `formatTableLabel(tableName)` util | Derivable from existing data — no extra schema column needed |
| Search approach | DB query | @-mentions need live cross-table search; lists are already loaded client-side |
| DB/service split | DB layer = single parameterized SELECT; service layer = iteration + enrichment | DB primitive stays dumb and reusable; config awareness belongs to the service |
| `tableConfigs` in search | Passed from frontend caller | Already loaded via `useTableConfigs()` — avoids redundant DB call |
| `adventureId` in `MentionNode` | Optional stored property | Set at insertion time; needed for adventure-scoped navigation |
| `adventureId` on `TextEditor` | Optional prop | Enables scoped search; optional guards future non-adventure contexts |
