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
- **Lexical:** All Lexical packages are at `0.41.0`.

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
- Stored properties: `entityId: string`, `entityType: string` (= `table_name`), `displayName: string`, `color: string`, `adventureId?: string`
  - `adventureId` is optional: required for adventure-scoped entity navigation, omitted for global-scoped

**Required methods:**

| Method | Details |
|---|---|
| `static getType()` | Returns `'mention'` |
| `static clone(node: MentionNode)` | Returns `new MentionNode(node.entityId, node.entityType, node.displayName, node.color, node.adventureId)` |
| `createDOM()` | Returns `document.createElement('span')` — the wrapper element for the React decorator |
| `updateDOM()` | Returns `false` — decorator nodes never need DOM updates |
| `isInline()` | Returns `true` |
| `decorate()` | Returns `<MentionBadge entityId={...} entityType={...} displayName={...} color={...} adventureId={...} />` — all stored properties passed as props |
| `getTextContent()` | Returns `` `@${this.displayName}` `` |
| `exportJSON()` | Returns `SerializedMentionNode` (see type below) |
| `static importJSON(json)` | Returns `new MentionNode(json.entityId, json.entityType, json.displayName, json.color, json.adventureId)` |

**`SerializedMentionNode` type** — defined and exported from `MentionNode.tsx`:

```typescript
import { SerializedLexicalNode } from 'lexical';

export type SerializedMentionNode = SerializedLexicalNode & {
  entityId: string;
  entityType: string;
  displayName: string;
  color: string;
  adventureId?: string;
};
```

`exportJSON()` must return `{ type: 'mention', version: 1, entityId, entityType, displayName, color, adventureId }` (omit `adventureId` key when undefined).

### 4c. Register `MentionNode`

- Add `MentionNode` to `initialConfig.nodes` array in `TextEditor.tsx`
- Add a `mention` key to the `theme` object for future CSS targeting:
  ```typescript
  const theme: EditorThemeClasses = {
    // ...existing keys...
    mention: 'editor-mention',
  };
  ```

### 4d. `MentionBadge` component

- **File:** `src/components/TextEditor/components/MentionBadge/MentionBadge.tsx`
- **CSS file:** `src/components/TextEditor/components/MentionBadge/MentionBadge.css` (required by convention — each component has its own CSS file)
- **Props:** `{ entityId: string; entityType: string; displayName: string; color: string; adventureId?: string }`
- **Renders:** `${displayName} [${formatTableLabel(entityType)}]` as inline text, with `color` applied as the text color
  - No color dot — the text itself is colored
- **On click:** navigate via `useNavigate` from `@tanstack/react-router`
  - Route segment derived from `entityType`: `entityType.slice(0, -1)` strips the trailing `s` to give the singular form, which matches the `Routes` enum values (e.g., `'npcs'` → `'npc'` = `Routes.NPC`)
  - Adventure-scoped (node has `adventureId`): `/${Routes.ADVENTURE}/${adventureId}/${entityType.slice(0, -1)}/${entityId}`
  - Global-scoped (node has no `adventureId`): `/${entityType.slice(0, -1)}/${entityId}`
- **Imports:** `Routes` from `@/routes`, `formatTableLabel` from `@/util`

### Lexical notes

- Currently on **Lexical v0.41.0**
- No built-in `MentionNode` — must be custom
- `LexicalTypeaheadMenuPlugin` available from `@lexical/react` (already installed)
- Custom nodes registered via `initialConfig.nodes` — zero required constructor args for Lexical's internal reconciler; the `MentionNode` constructor takes all stored properties

### Files to create/modify

- `src/util/formatTableLabel.ts` (new)
- `src/util/index.ts` (add `export * from './formatTableLabel'`)
- `src/components/TextEditor/nodes/MentionNode.tsx` (new — exports `MentionNode` and `SerializedMentionNode`)
- `src/components/TextEditor/nodes/index.ts` (new barrel — `export * from './MentionNode'`)
- `src/components/TextEditor/components/MentionBadge/MentionBadge.tsx` (new)
- `src/components/TextEditor/components/MentionBadge/MentionBadge.css` (new)
- `src/components/TextEditor/components/index.ts` (switch from `export *` to explicit named exports — two exports now require it per CLAUDE.md):
  ```typescript
  export { FloatingToolbar } from './FloatingToolBar/FloatingToolbar';
  export { MentionBadge } from './MentionBadge/MentionBadge';
  ```
- `src/components/TextEditor/TextEditor.tsx` (register node + theme classes)

---

## Phase 5: @-Mention — Typeahead Popup

**Why fifth:** Requires `MentionNode` (Phase 4).

### 5a. Mention search DB function

- **File:** `db/mention-search.ts`
- Cross-table concern — no single domain owns it, flat file at DB root is appropriate (deliberate exception to the "functions for 1 table grouped in a directory" convention)
- No barrel file — flat file at db root, not a module directory
- Single primitive: one parameterized SELECT against a given table — no orchestration, no iteration, no config awareness
- Signature: `searchByName(tableName: string, query: string, adventureId: string | null): Promise<{ id: string; name: string; updated_at: string }[]>`
  - `adventureId !== null`: appends `AND adventure_id = $adventureId` to the WHERE clause
  - `adventureId === null`: no adventure filter (global-scoped tables)
  - Always `ORDER BY updated_at DESC` — no limit
  - Returns raw rows only — no enrichment, no type beyond the row shape
- Import in consuming files: `import * as mentionSearch from '@db/mention-search'` (namespace import, per db CLAUDE.md convention)

### 5b. Mention search service

- **File:** `src/services/mentionSearchService.ts`
- Owns orchestration and the `MentionSearchResult` type — this is where config awareness lives, not the DB layer
- `MentionSearchResult` defined here: `{ id: string; name: string; tableName: string; color: string; adventureId?: string; updated_at: string }`
  - `adventureId` included only for adventure-scoped results (stored in `MentionNode` for navigation)
  - `updated_at` included to enable cross-table sort after merge
- `searchMentions(query: string, adventureId: string, tableConfigs: TableConfig[]): Promise<MentionSearchResult[]>`
  - Wraps entirely in try/catch — throws `MentionSearchError` from `src/domain/mentions` on failure
  - Iterates configs where `tagging_enabled === 1`
  - For each config, calls `mentionSearch.searchByName(config.table_name, query, config.scope === 'adventure' ? adventureId : null)`
  - Enriches each row with `tableName` and `color` from the config; includes `adventureId` on result only when `config.scope === 'adventure'`
  - Flattens all per-table results into a single array
  - Sorts the merged array by `updated_at` descending before returning (per-table ORDER BY is not sufficient after merging)

### 5c. `MentionTypeaheadPlugin`

- **File:** `src/components/TextEditor/plugins/MentionTypeaheadPlugin.tsx`
- **CSS file:** `src/components/TextEditor/plugins/MentionTypeaheadPlugin.css` (required by convention)
- Uses `LexicalTypeaheadMenuPlugin` from `@lexical/react`
- Trigger: `@` character
- Gets `tableConfigs` via `useTableConfigs()` directly — no provider needed
- `adventureId` prop is `string` (always provided — `TextEditor` is always mounted with an adventure context)
- On trigger: call `mentionSearchService.searchMentions(queryText, adventureId, tableConfigs)`
- `MentionSearchResult` imported from `src/services/mentionSearchService.ts`
- Popup renders each result as: `${result.name} [${formatTableLabel(result.tableName)}]` — text colored with `result.color`, no color dot
- On select: insert `MentionNode` with `{ entityId: result.id, entityType: result.tableName, displayName: result.name, color: result.color, adventureId: result.adventureId }`, remove `@query` text via `LexicalTypeaheadMenuPlugin`'s `onSelectOption` callback
- Keyboard nav: arrow keys + Enter to select, Escape to dismiss

### 5d. Wire into `TextEditor`

- Add `adventureId: string` prop to `TextEditor` (typed as `string`, not optional — current usage always has an adventure context; the optional guard for future non-adventure contexts is handled at the call site)
- Add `<MentionTypeaheadPlugin adventureId={adventureId} />` inside `LexicalComposer`
- Update `NpcScreen` and `AdventureScreen` to pass `adventureId` to each `<TextEditor>` (both already have it via `useParams`)

### Domain errors

- **File:** `src/domain/mentions/errors.ts`
  ```typescript
  export class MentionSearchError extends Error {
    constructor(cause?: unknown) {
      super('Failed to search mentions');
      this.cause = cause;
    }
  }
  ```
- **File:** `src/domain/mentions/index.ts` — `export { MentionSearchError } from './errors'`

### Files to create/modify

- `db/mention-search.ts` (new)
- `src/domain/mentions/errors.ts` (new)
- `src/domain/mentions/index.ts` (new)
- `src/services/mentionSearchService.ts` (new)
- `src/components/TextEditor/plugins/MentionTypeaheadPlugin.tsx` (new)
- `src/components/TextEditor/plugins/MentionTypeaheadPlugin.css` (new)
- `src/components/TextEditor/plugins/index.ts` (new barrel — `export * from './MentionTypeaheadPlugin'`)
- `src/components/TextEditor/TextEditor.tsx` (add plugin + `adventureId` prop)
- `src/screens/npc/NpcScreen.tsx` (pass `adventureId` to both `<TextEditor>` instances)
- `src/screens/adventure/AdventureScreen.tsx` (pass `adventureId` to `<TextEditor>`)

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

- Manually create a `MentionNode` in the editor → renders as colored text badge
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
| `adventureId` on `TextEditor` | Required `string` prop (currently) | All current editors are in adventure context; optional guard lives at the call site |
| Search result limit | None | Local dataset (hundreds of rows); no performance concern |
| Route derivation in `MentionBadge` | `entityType.slice(0, -1)` | Strips plural `s` — matches `Routes` enum singular values exactly |
| `db/mention-search.ts` location | Flat file at db root | Cross-table concern — no single domain directory owns it |
| `components/index.ts` export style | Explicit named exports | Two exports (`FloatingToolbar` + `MentionBadge`) require explicit per CLAUDE.md |

---

## CLAUDE.md Impact

### `db/CLAUDE.md`

Add a note documenting the cross-table utility pattern:

> **Cross-table utilities:** Functions that operate across multiple tables (e.g., `mention-search.ts`) live as flat files at the db root, not in a domain subdirectory. This is a deliberate exception to the "group by table" convention — cross-table concerns have no single domain owner.
