# SPEC: Search, Filter, Sort & @-Mention System

## Before anything else

Read all CLAUDE.md files!

## Purpose

Enable searching, filtering, and sorting across list screens (NpcsScreen, etc.) and implement an @-mention system in all TextEditor fields to link entities (NPCs, sessions, etc.) with color-coded, clickable inline badges.

## User Stories

1. **@-Mention in TextEditor** — Type `@` in any text field to search and link NPCs/sessions/etc. with color-coded badges that navigate on click
2. **Table Config** — DB-persisted config for color coding, tagging eligibility, and scope (adventure vs global) per table. Editable via settings screen.
3. **Sortable Table Headers** — Click column headers to sort lists (asc/desc toggle)
4. **List Filtering** — Search input that filters by name (primary) and other fields like description (secondary), returned as two separate arrays
5. **Reference List** — DEFERRED. Show where an entity is mentioned across the adventure.

---

## Phase 1: Table Config System (foundation for everything)

**Why first:** Color coding, tagging eligibility, and scope (adventure-scoped vs global) are referenced by every other feature. This is the single source of truth.

### 1a. Database: `table_config` table

- **File:** `db/table-config/schema.ts`
- **Schema:**
  ```
  table_config (
    id TEXT PK,
    table_name TEXT NOT NULL UNIQUE,  -- e.g. 'npcs', 'sessions', 'adventures'
    display_name TEXT NOT NULL,       -- e.g. 'NPC', 'Session', 'Adventure'
    color TEXT NOT NULL,              -- hex color for tag display, e.g. '#4a9eff'
    tagging_enabled INTEGER DEFAULT 1,  -- 0/1 boolean: show in @-mention results
    scope TEXT NOT NULL DEFAULT 'adventure',  -- 'adventure' | 'global'
    name_column TEXT NOT NULL DEFAULT 'name', -- which column holds the display name (always 'name' by convention)
    searchable_columns TEXT,          -- JSON array of columns to search, e.g. '["name","description","summary"]'
    created_at, updated_at
  )
  ```
- **Seed data:** Insert default rows for `adventures`, `npcs`, `sessions` on DB init
- **CRUD:** `db/table-config/` — `get-all.ts`, `get.ts`, `update.ts` (no create/remove — rows managed by seed)
- **Types:** `db/table-config/types.ts` — `TableConfig`, `UpdateTableConfigInput`

### 1b. Service Layer

- **File:** `src/services/tableConfigService.ts`
- Wraps DB functions, throws domain errors
- Functions: `getAllTableConfigs()`, `getTableConfig(id)`, `updateTableConfig(id, data)`
- Follows existing service pattern (see `adventureService.ts`)

### 1c. Frontend: Table Registry

- **File:** `src/providers/table-config/TableConfigProvider.tsx` + `useTableConfig.ts`
- Loads all `table_config` rows on app init via TanStack Query (`queryKey: ['tableConfig']`)
- Exposes helper: `getConfigForTable(tableName: string) => TableConfig | null`
- Add to provider chain in `DataProvider.tsx` (at the top, before ImageProvider)

### 1d. Settings Screen (optional but requested)

- **Route:** `/settings` or accessible from sidebar
- **Screen:** `src/screens/settings/SettingsScreen.tsx`
- Table listing all `table_config` rows with editable fields: color (color picker), tagging_enabled (toggle)
- Uses `useTableConfig()` hook + update mutation

### Files to create/modify:
- `db/table-config/` (schema, types, get-all, get, update, index)
- `db/database.ts` (register table + seed)
- `src/domain/table-config/errors.ts` + `index.ts`
- `src/services/tableConfigService.ts`
- `src/providers/table-config/` (provider, hook, index)
- `src/providers/DataProvider.tsx` (add to chain)
- `src/screens/settings/` (screen + CSS)
- `src/routes/settings.tsx`

---

## Phase 2: Sortable Table Headers (User Story 3)

**Why second:** Pure frontend logic, no new tables. Validates the list screen pattern before adding search complexity.

### 2a. Generic `useSortable` hook

- **File:** `src/hooks/useSortable.ts`
- Accepts an array of items + sort config
- Returns sorted items + sort state (column, direction)
- Supports toggling direction (asc → desc → default)
- Generic: `useSortable<T>(items: T[], defaultSort: SortConfig<T>)`

### 2b. Sortable `TableHeadRow` component

- Refactor existing `TableHeadRow` in `NpcsScreen.tsx` — currently sets `sortBy` state but never actually sorts
- Extract into reusable component: `src/components/SortableTableHeader/SortableTableHeader.tsx`
- Visual: ChevronDown for desc, ChevronUp for asc, no icon for inactive
- Column config passed as props (label, sort key)

### 2c. Apply to NpcsScreen

- Replace inline `TableHeadRow` + unsorted list with `useSortable` + `SortableTableHeader`
- Sort by: name (string), created_at (date), updated_at (date)

### Files to create/modify:
- `src/hooks/useSortable.ts` (new)
- `src/components/SortableTableHeader/` (new: SortableTableHeader.tsx + SortableTableHeader.css)
- `src/components/index.ts` (add SortableTableHeader export)
- `src/screens/npcs/NpcsScreen.tsx` (refactor)

---

## Phase 3: List Filtering / Search (User Story 4)

**Why third:** Builds on the sorted list from Phase 2. Adds input-driven filtering.

### 3a. Search logic

- **Approach:** Client-side filtering (data is already loaded via TanStack Query). For a local SQLite app with lists in the low hundreds, this is the right tradeoff — no need for server-side search/pagination complexity.
- **File:** `src/hooks/useListFilter.ts`
- Two-tier matching, returned as **two separate arrays** for distinct display:
  1. **`nameMatches: T[]`** — `name` column, case-insensitive partial match. Ordered: `startsWith` matches first, then `includes` matches.
  2. **`fieldMatches: T[]`** — Other searchable columns (from `table_config.searchable_columns`), case-insensitive partial match. Excludes items already in `nameMatches`.
- Generic: `useListFilter<T>(items: T[], searchTerm: string, config: FilterConfig) => { nameMatches: T[], fieldMatches: T[] }`
- **Convention note:** All tables use `name` as their display column (never `title`).

### 3b. Search input component

- **File:** `src/components/SearchInput/SearchInput.tsx`
- Simple text input with search icon, clear button
- Debounced (300ms) to avoid filtering on every keystroke
- Placed above the table header row
- Export via `src/components/index.ts` barrel file

### 3c. Apply to NpcsScreen

- Add `SearchInput` above `SortableTableHeader`
- Pipe: raw npcs → `useListFilter` → `useSortable` (applied to each array) → rendered list with two sections
- Searchable columns for NPCs: `name`, `summary`, `description`
- `fieldMatches` section shows a subtle label indicating which field matched (e.g. "found in description")

### Files to create/modify:
- `src/hooks/useListFilter.ts` (new)
- `src/components/SearchInput/` (new: SearchInput.tsx + SearchInput.css)
- `src/components/index.ts` (add SearchInput export)
- `src/screens/npcs/NpcsScreen.tsx` (extend)

---

## Phase 4: @-Mention — Custom Lexical MentionNode (User Story 1, foundation)

**Why fourth:** The node must exist before the typeahead popup can insert it.

### 4a. Install `@lexical/link` (if not already present — it's not in current deps)

### 4b. Custom `MentionNode`

- **File:** `src/components/TextEditor/nodes/MentionNode.ts`
- Extends `DecoratorNode` (not LinkNode — we need React rendering for color-coded badges + click handling)
- Stored properties: `entityId`, `entityType` (table name), `displayName`, `color`
- `decorate()` returns a small React component: colored badge with the entity name
- `exportJSON()` / `importJSON()` / `getTextContent()` for serialization
- Clicking the badge navigates to the entity's route (e.g. `/adventure/:id/npc/:npcId`)

### 4c. Register MentionNode

- Add `MentionNode` to `initialConfig.nodes` array in `TextEditor.tsx`
- Add mention-specific theme classes

### 4d. MentionComponent (the rendered badge)

- **File:** `src/components/TextEditor/components/MentionBadge.tsx`
- Renders: colored inline badge with entity name
- Color comes from the node's `color` property (sourced from `table_config` at insertion time)
- OnClick: navigate via TanStack Router

### Lexical version & packages:
- Currently on **Lexical v0.39.0**
- No built-in MentionNode exists — must be custom
- `LexicalTypeaheadMenuPlugin` available from `@lexical/react` (already installed)
- Custom nodes registered via `initialConfig.nodes` array (zero required constructor args)

### Files to create/modify:
- `src/components/TextEditor/nodes/MentionNode.ts` (new)
- `src/components/TextEditor/components/MentionBadge.tsx` (new)
- `src/components/TextEditor/TextEditor.tsx` (register node)
- `package.json` (add `@lexical/link` if needed for utilities)

---

## Phase 5: @-Mention — Typeahead Popup (User Story 1, interaction)

**Why fifth:** Requires MentionNode (Phase 4) + TableConfig (Phase 1).

### 5a. Mention search DB function

- **File:** `db/mention-search.ts`
- Single function: `searchForMention(query: string, adventureId: string, tableConfigs: TableConfig[]) => MentionSearchResult[]`
- For each table where `tagging_enabled = true`:
  - If `scope === 'adventure'`: filter by `adventure_id`
  - If `scope === 'global'`: no adventure filter
  - Search `name_column LIKE '%query%'`
  - Order by `updated_at DESC`
  - Limit per table (e.g. 5)
- Returns: `{ id, name, tableName, displayName, color }[]`
- **Performance note:** For small-to-medium datasets this is fine. If tables grow large, we can add SQLite FTS later.

### 5b. Mention service

- **File:** `src/services/mentionSearchService.ts`
- Wraps the DB function, passes current `tableConfig` data

### 5c. MentionTypeaheadPlugin (Lexical plugin)

- **File:** `src/components/TextEditor/plugins/MentionTypeaheadPlugin.tsx`
- Uses Lexical's `LexicalTypeaheadMenuPlugin` (from `@lexical/react`)
- Trigger: `@` character
- On trigger: query `mentionSearchService` with the text after `@`
- Popup renders below the cursor line showing:
  - Each result as: `[ColorDot] EntityName [TableDisplayName]`
  - Grouped or interleaved, ordered by `updated_at`
- On select: insert `MentionNode` into editor, remove the `@query` text
- Keyboard nav: arrow keys + Enter to select, Escape to dismiss

### 5d. Wire into TextEditor

- Add `MentionTypeaheadPlugin` to `TextEditor.tsx`
- Pass `adventureId` as a new prop to `TextEditor` (needed for scoped search)
- Update all TextEditor usages to pass `adventureId`

### Files to create/modify:
- `db/mention-search.ts` (new)
- `src/services/mentionSearchService.ts` (new)
- `src/components/TextEditor/plugins/MentionTypeaheadPlugin.tsx` (new)
- `src/components/TextEditor/TextEditor.tsx` (add plugin + prop)
- `src/screens/npc/NpcScreen.tsx` (pass adventureId to TextEditor)
- `src/screens/adventure/AdventureScreen.tsx` (pass adventureId to TextEditor — check current usage)

---

## Phase 6: Reference List (User Story 5) — DEFERRED

Per discussion, this is deferred until Phases 1-5 are solid. Two notes for future implementation:

- **Approach:** With `MentionNode` storing structured `entityId` + `entityType`, a `mentions` tracking table (populated on text save) will be the cleanest approach
- **Alternative:** On-the-fly search across all text fields for the entity's ID (works but slower)
- **Prerequisite:** MentionNode must be stable and in use

---

## Maintainability: "How many files to touch when adding a new table?"

### With this design, adding a new table (e.g. `factions`) requires:

1. **DB layer:** Create `db/faction/` with standard CRUD (same as today)
2. **Seed `table_config`:** Add one INSERT row in `db/database.ts` seed — this is the **single source of truth** for color, tagging, scope, searchable columns
3. **List screen:** Use `useSortable` + `useListFilter` hooks (generic, no changes to hooks needed)
4. **TextEditor:** No changes — MentionTypeaheadPlugin reads from `table_config` dynamically

**Total touch points for @-mention support of a new table: 1 line** (the seed INSERT). The rest is standard table setup you'd do anyway.

---

## Verification Plan

### Phase 1:
- Create table_config, verify seed data loads
- Open settings screen, change a color, verify it persists after restart

### Phase 2:
- Click Name header → NPCs sort A-Z, click again → Z-A
- Click Created At → sort by date, click again → reverse

### Phase 3:
- Type in search → list filters by name matches first
- Type a word that only appears in a description → NPC appears below name matches
- Clear search → full list returns

### Phase 4:
- Manually create a MentionNode in editor (via test) → verify it renders as colored badge
- Click badge → navigates to entity screen
- Save & reload → mention persists in JSON

### Phase 5:
- Type `@` in any TextEditor → popup appears with recent entities
- Type `@Gob` → filters to NPCs matching "Gob"
- Select item → MentionNode inserted with correct color
- Results show table type labels (NPC, Session, etc.)

---

## Key Technical Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Mention node type | `DecoratorNode` | Need React component for color badge + click handler |
| Search approach | Client-side for lists, DB query for @-mentions | Lists are already loaded; @-mentions need cross-table search |
| Table config storage | SQLite `table_config` table | User requested DB-persisted, editable via settings |
| Mention scope | Configurable per table via `scope` column | Adventure-scoped vs global per table |
| Filter debounce | 300ms | Fast enough to feel responsive, slow enough to avoid excess work |
| Sort state | Frontend only (no DB query changes) | Data already loaded, sorting in-memory is instant |
| List search | Client-side two-tier | Local app, low hundreds of entries, no pagination needed |
