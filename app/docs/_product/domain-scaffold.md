# Domain Scaffold

Reference document for implementing a new standard domain entity. Hand to `/write-specs`
along with a domain name to generate a concrete, /implement-ready spec.

This document is long-lived. Update it when core infrastructure changes (new layers,
changed conventions, new ambient systems). Do not delete it when specs are implemented.

## Usage

```
/write-specs "Implement a new domain named [SINGULAR] (plural: [PLURAL]) following
app/docs/_product/domain-scaffold.md.
Customizations:
- Summary template lines: [list placeholder lines for the rich-text summary, or 'base pattern']
- Table config color: [rgb string, e.g. '248, 255, 255']
- Custom columns beyond base schema: [list, or 'none']
- tagging_enabled: [0 or 1, default 1]
- scope: ['adventure' or 'global', default 'adventure']"
```

/write-specs will verify all paths and imports against the current codebase before writing.
All identifiers are derived from the naming conventions below — supply only the
customizations above.

## Naming Conventions

Given a singular/plural pair (example: `Foe` / `Foes`):

| Identifier | Rule | Example |
|---|---|---|
| DB table name | plural lowercase | `foes` |
| DB directory | `db/[singular lowercase]` | `db/foe/` |
| Domain directory | `domain/[plural lowercase]` | `domain/foes/` |
| Service file | `[plural]Service.ts` | `foesService.ts` |
| DB entity type | PascalCase singular | `Foe` |
| DB update input type | `Update[Singular]Input` | `UpdateFoeInput` |
| Service update data type | `Update[Singular]Data` | `UpdateFoeData` |
| Error type/factory prefix | PascalCase singular | `Foe` |
| DAL directory | `data-access-layer/[plural lowercase]` | `data-access-layer/foes/` |
| Query keys const | `[singular]Keys` | `foeKeys` |
| List hook | `use[Plural]` | `useFoes` |
| Detail hook | `use[Singular]` | `useFoe` |
| List screen component | `[Plural]Screen` | `FoesScreen` |
| Detail screen component | `[Singular]Screen` | `FoeScreen` |
| Header sub-component | `[Singular]Header` | `FoeHeader` |
| Sidebar sub-component | `[Singular]Sidebar` | `FoeSidebar` |
| List screen directory | `screens/[plural lowercase]` | `screens/foes/` |
| Detail screen directory | `screens/[singular lowercase]` | `screens/foe/` |
| List route file | `adventure.$adventureId.[plural lowercase].tsx` | `adventure.$adventureId.foes.tsx` |
| Detail route file | `adventure.$adventureId.[singular].$[singular]Id.tsx` | `adventure.$adventureId.foe.$foeId.tsx` |
| URL id param | `[singular]Id` | `foeId` |
| Breadcrumb kind | plural lowercase — same value as DB table name, a member of `EntityType` | `'foes'` |
| Breadcrumb crumb component | `[Singular]Crumb` | `FoeCrumb` |
| Table config `table_name` | plural lowercase | `'foes'` |
| `assertValidId` label in CRUD files | PascalCase singular | `'Foe'` |
| `assertValidId` label for adventureId (get-all only) | always `'Adventure'` | `'Adventure'` |
| `textEditorId` prefix | SCREAMING_SNAKE singular | `'FOE'` |

## Base Schema

All standard domain entities share these columns. Do not add or remove without explicit
user instruction.

| Column | SQL type | Nullable | Zod | Notes |
|---|---|---|---|---|
| `id` | `TEXT` PRIMARY KEY | No | `z.string()` | nanoid, generated in `create.ts` |
| `adventure_id` | `TEXT` NOT NULL | No | `z.string()` | FK → `adventures.id` ON DELETE CASCADE |
| `name` | `TEXT` | Yes | `z.string().nullable()` | user-editable, must be nullable (auto-save rule) |
| `summary` | `TEXT` | Yes | `z.string().nullable()` | Lexical JSON; template set in `create.ts` |
| `description` | `TEXT` | Yes | `z.string().nullable()` | Lexical JSON; no default template |
| `image_id` | `TEXT` | Yes | `z.string().nullable().optional()` | FK → `images.id` ON DELETE SET NULL |
| `pinned_order` | `INTEGER` | Yes | `z.number().nullable()` | `NULL` = unpinned; non-null = ascending pin position |
| `created_at` | `TEXT` NOT NULL | No | `z.string()` | ISO 8601 UTC, set in `create.ts` |
| `updated_at` | `TEXT` NOT NULL | No | `z.string()` | ISO 8601 UTC, set by `buildUpdateQuery` |

`app/db/CLAUDE.md` bans `.optional()` on any `zodSchema` field, and the ban applies
unconditionally to new columns. Existing domain schemas that still use `.optional()` on
`name`, `summary`, or `description` predate that rule and are grandfathered references —
do not copy that form when scaffolding a new domain; use `.nullable()` alone as shown above.

## Implementation Notes

**Validate reference implementations before replicating.** Before using any domain file as
a pattern reference, verify it against current CLAUDE.md conventions. Convention changes
retroactively invalidate previously correct code — a stale reference propagates violations
to every new domain that copies it. When a violation is found during this check, fix it
before using the file as a template.

**`routeTree.gen.ts` is gitignored.** TanStack Router regenerates it automatically on dev
server start, but `tsc --noEmit` requires it during implementation. After creating new route
files, manually add the two new route entries to `routeTree.gen.ts` so that type checks pass.
This manual edit does not need to be committed — the dev server will regenerate the file
correctly from the route files on first start.

**SF coupling: screens + barrel registrations must be committed together.** The detail and
list screen components import from `@/data-access-layer` (e.g. `usePc`, `usePcs`), which
only exports those hooks after the barrel registration SF. tsc will fail on the screens SF
alone. Implement the barrel registrations SF before running any baseline checks, and commit
both SFs as a unit.

## Layer Patterns

### DB Layer (`db/[singular]/`)

Seven CRUD files + barrel + test directory. NPC reference: `db/npc/`.

**schema.ts** — `defineTable()` call. Import `z` from `'zod'` and `defineTable` from
`'../util'`. Table name is the plural lowercase string.

**types.ts**:

```ts
import z from 'zod';
import { [singular]Table } from './schema';

export type [Singular] = z.infer<typeof [singular]Table.zodSchema>;
export type Update[Singular]Input = z.infer<typeof [singular]Table.updateSchema>;
```

**create.ts** — generates id (`generateId()`), timestamps (`generateDbTimestamps()`),
default name (`'New [Singular] ' + getDateTimeString(now)`), and summary template
(Lexical JSON string — domain-specific, provided at spec-generation time).
Uses `buildCreateQuery<{...}>('[plural]', id, { ... })`. Returns `id: string`.

**get.ts** — `SELECT * FROM [plural] WHERE id = $1`. Returns `[Singular] | null`.
`assertValidId(id, '[Singular]')`.

**get-all.ts** — `SELECT * FROM [plural] WHERE adventure_id = $1 ORDER BY created_at DESC`.
Returns `[Singular][]`. `assertValidId(adventureId, 'Adventure')`.

**update.ts** — `assertValidId(id, '[Singular]')`, `assertHasUpdateFields(data)`,
`[singular]Table.updateSchema.parse(data)`, then `buildUpdateQuery('[plural]', id, validated)`.

**remove.ts** — `DELETE FROM [plural] WHERE id = $1`. `assertValidId(id, '[Singular]')`.

**index.ts** — explicit named exports (`export *` banned):

```ts
export { create } from './create';
export { get } from './get';
export { getAll } from './get-all';
export { update } from './update';
export { remove } from './remove';
export type { [Singular], Update[Singular]Input } from './types';
```

**`__tests__/`** — five test files (create, get, get-all, update, remove). Each mocks
`@tauri-apps/plugin-sql` at module scope and calls `vi.resetModules()` in `afterEach`.
`create.test.ts` also mocks `generateId` (via `../../util`) and uses
`vi.useFakeTimers()` / `vi.setSystemTime()` + `vi.useRealTimers()` in afterEach.
NPC reference: `db/npc/__tests__/`.

**`db/_migrations/`** (New migration file) — Create a new migration file named
`{Date.now()}_{domain-plural}.ts`. It performs three writes, in order: (1)
`[singular]Table.createTableSQL`, (2) three `CREATE TRIGGER IF NOT EXISTS` statements
registering the table with the sync infrastructure — written as literal SQL, substituting
`[plural]` for `tableName` in the trigger template `buildTriggerSQL` produces in
`db/_migrations/1784365870026_add_sync_infrastructure.ts`; do not import or re-export that
helper, since a migration is a frozen historical artifact and a shared helper would let a
later edit retroactively change an already-applied migration's behavior, and (3) the new
domain's `table_config` row insert, following the `INSERT OR IGNORE INTO table_config`
statement in `db/_migrations/1780099200000_seed_table_config.ts`. Add the migration to the
`migrations` array in `db/_migrations/index.ts`, as the last element — `migrationHead` is
read as `migrations[migrations.length - 1].id` and must remain the highest id. Do not
modify `db/database.ts`.

**Sync Registration** — `db/_sync/registry.ts` needs a
`{ name: '[plural]', columns: Object.keys([singular]Table.zodSchema.shape) }` entry added
to `SYNCED_TABLES`, placed inside the adventure-scoped block (after `adventures` and before
`table_config`, per the file's own parents-before-children ordering comment). This is
separate from the migration's frozen trigger copy above — the registry is the live,
current-state list `getChangesSince` and the upsert/delete apply paths read, and it must be
kept current on every new domain. `db/_sync/__tests__/registry.test.ts` asserts an exact
synced-table count (`toHaveLength` and a `Set` size assertion) and an
`ADVENTURE_SCOPED_TABLES` list — both go stale and must be updated on every new
adventure-scoped table.

### Domain Layer (`domain/[plural]/`)

Two files: `errors.ts`, `index.ts`. NPC reference: `domain/npcs/`.

**errors.ts** — five error factory functions following `app/CLAUDE.md` factory pattern:

| Name | Message template |
|---|---|
| `[singular]NotFoundError(id)` | `'[Singular] with id ${id} not found'` |
| `[singular]LoadError(cause?)` | `'Failed to load [Plural]: ${String(cause)}'` |
| `[singular]CreateError(cause?)` | `'Failed to create [Singular]: ${String(cause)}'` |
| `[singular]UpdateError(id, cause?)` | `'Failed to update [Singular] ${id}: ${String(cause)}'` |
| `[singular]DeleteError(id, cause?)` | `'Failed to delete [Singular] ${id}: ${String(cause)}'` |

**index.ts** — explicit named exports for all 10 symbols (5 `export type`, 5 `export`).

**`domain/index.ts`** (Modified) — add a block following the NPC block structure:

```ts
export type {
  [Singular]NotFoundError,
  [Singular]LoadError,
  [Singular]CreateError,
  [Singular]UpdateError,
  [Singular]DeleteError,
} from './[plural]';
export {
  [singular]NotFoundError,
  [singular]LoadError,
  [singular]CreateError,
  [singular]UpdateError,
  [singular]DeleteError,
} from './[plural]';
```

### Service Layer (`services/[plural]Service.ts`)

One file. NPC reference: `services/npcsService.ts`.

Imports: `import * as [singular]Db from '@db/[singular]'`,
`import * as imageService from '@services/imageService'`,
`import type { [Singular], Update[Singular]Input } from '@db/[singular]'`,
domain errors from `@domain/[plural]`.

`Update[Singular]Data = Update[Singular]Input & { imgFilePath?: string }`.

Six exported functions:

| Function | Throws |
|---|---|
| `get[Plural](adventureId)` | `[singular]LoadError` |
| `get[Singular]ById(id)` | `[singular]NotFoundError` on null |
| `create[Singular](adventureId)` | `[singular]CreateError` |
| `update[Singular](id, data)` | `[singular]UpdateError` |
| `remove[Singular]Image([singular]Id)` | `[singular]UpdateError` (fetch + early-return guard are outside the `try` — see note below) |
| `delete[Singular](id, [singular]?)` | `[singular]DeleteError` |

**`remove[Singular]Image` structure note**: call `get[Singular]ById` and the early-return
guard (`if (!entity.image_id) return;`) *before* the `try` block, not inside it. This
ensures a not-found error surfaces as `[singular]NotFoundError`, not `[singular]UpdateError`.
Only the image deletion and DB update go inside the `try`.

```ts
export const remove[Singular]Image = async ([singular]Id: string): Promise<void> => {
  const [singular] = await get[Singular]ById([singular]Id);
  if (![singular].image_id) return;
  try {
    await imageService.deleteImage([singular].image_id);
    await [singular]Db.update([singular]Id, { image_id: null });
  } catch (err) {
    throw [singular]UpdateError([singular]Id, err);
  }
};
```

### DAL (`src/data-access-layer/[plural]/`)

Four files: `[singular]Keys.ts`, `use[Plural].ts`, `use[Singular].ts`, `index.ts`.
NPC reference: `data-access-layer/npcs/`.

**[singular]Keys.ts**:

```ts
export const [singular]Keys = {
  list: (adventureId: string) => ['[plural]', adventureId] as const,
  detail: ([singular]Id: string) => ['[singular]', [singular]Id] as const,
};
```

**use[Plural].ts** — `useQuery` (list) + `useMutation` (create, invalidates list key).
Returns `{ [plural]: [Singular][], loading: boolean, create[Singular]: () => Promise<string> }`.
`queryKey: [singular]Keys.list(adventureId)`. `enabled: !!adventureId`.
`throwOnError: true` on query.

**use[Singular].ts** — `useQuery` (detail, `staleTime: 0, refetchOnMount: 'always',
throwOnError: true`) + three mutations (update with 500 ms debounce + optimistic update
via `mergeUpdate`, delete, remove image). Each mutation invalidates the relevant keys.
Returns `{ [singular]: [Singular] | null, loading: boolean, update[Singular]: (data) => void,
delete[Singular]: () => Promise<void>, remove[Singular]Image: () => Promise<void> }`.
Import `mergeUpdate` from `'../mergeUpdate'`.
`delete[Singular]` and `remove[Singular]Image` must be declared as named wrapper functions
— never assign `mutation.mutateAsync` directly on the return object (violates the
"never expose TanStack internals" rule in `src/CLAUDE.md`).

```ts
const delete[Singular] = async (): Promise<void> => {
  await deleteMutation.mutateAsync();
};
const remove[Singular]Image = async (): Promise<void> => {
  await remove[Singular]ImageMutation.mutateAsync();
};
```

**index.ts** — explicit named exports: `use[Plural]`, `use[Singular]`, `[singular]Keys`.

**`data-access-layer/index.ts`** (Modified) — add:

```ts
export { use[Plural], use[Singular], [singular]Keys } from './[plural]';
```

### Frontend — List Screen (`screens/[plural]/[Plural]Screen.tsx`)

**Purpose**: Sortable, searchable entity list. Creates new entities and navigates to detail.

**Behavior**: `useParams({ from: '/adventure/$adventureId/[plural]' })`. Fetches via
`use[Plural](adventureId)` and `useTableConfigs()`. Finds config: `tableConfigs.find(c => c.table_name === '[plural]')`. On create: calls `create[Singular]()`, navigates to
`/adventure/${adventureId}/[singular]/${new[Singular]Id}`.
Loading guard: `if ([plural]Loading || configsLoading) return <div className='content-center'><LoadingIcon /></div>`.
Missing config guard (separate, after loading): `if (![plural]TableConfig) throw tableConfigNotFoundError('[plural]')`.
Import `tableConfigNotFoundError` from `@domain/table-config`. Never fold the missing-config
case into the loading guard — a missing config is an error, not a loading state.

**UI**: `SortableList<[Singular]>` with `tableConfigId`, `items`, `onRowClick`,
`onCreateNew`, `searchPlaceholder`.

Companion CSS file: `[Plural]Screen.css` (empty — no domain-specific list layout).

NPC reference: `screens/npcs/NpcsScreen.tsx`.

### Frontend — Detail Screen (`screens/[singular]/`)

Three component files + barrel + two CSS files.

**[Singular]Screen.tsx**

**Purpose**: Main detail view — sidebar left, scrollable content right.

**Behavior**: `useParams({ from: '/adventure/$adventureId/[singular]/$[singular]Id' })`.
Calls `use[Singular]([singular]Id, adventureId)`. Loading/null guard returns
`<div><LoadingIcon /></div>`. Description `TextEditor` calls `update[Singular]({ description })`.
`textEditorId`: `'[SINGULAR_UPPER]_${[singular].id}_description'`.

**UI**: `GlassPanel className='[singular]-screen'` (CSS grid `grid-template-columns: auto 1fr`,
`padding: var(--spacing-md)`, `gap: var(--spacing-lg)`). Left: `[Singular]Sidebar`. Right:
`CustomScrollArea` > `div className='[singular]-text-edit-area'`
(grid `grid-template-rows: auto 1fr`, `height: 100%`, `gap: var(--spacing-md)`) >
`[Singular]Header` then `TextEditor`.

**[Singular]Header.tsx**

**Purpose**: Name input + summary rich-text editor in a styled panel.

**Behavior**: `useParams` + `use[Singular]`. `useState([singular]?.name ?? '')` for name.
`textEditorId`: `'[SINGULAR_UPPER]_${[singular].id}_summary'`. Returns `undefined` guard if
no entity.

**UI**: `GlassPanel className='[singular]-summary' intensity='bright'`
(grid rows `auto 1fr`, `padding: var(--spacing-md)`, `gap: var(--spacing-sm)`,
`height: var(--summary-content-height)`, `max-width: 600px`).
`Input placeholder='Name'` with `className='[singular]-name-input'`
(`font-size: var(--font-size-3xl)`, `font-weight: var(--font-weight-medium)`).
`CustomScrollArea` > `TextEditor` for summary.

**[Singular]Sidebar.tsx**

**Purpose**: Image upload + delete controls.

**Behavior**: `useParams({ from: '/adventure/$adventureId/[singular]/$[singular]Id' })` +
`use[Singular]` + `useDeleteDialog` + `useRouter`. On delete: `await delete[Singular]()`,
then navigate to `/adventure/${adventureId}/[plural]`. Returns `undefined` guard if no entity.
`PREVIEW_WIDTH` and `PREVIEW_HEIGHT` from `'@/screens/screens.constants'`.

**UI**: `<aside className='[singular]-sidebar'>` (flex column, `gap: var(--spacing-md)`).
`UploadImgBtn`, then `<ScreensDuplicateBtn entityType='[plural]' />` (see Duplication
below), then danger `Button label='Delete [Singular]'` via `openDeleteDialog`
(`oneClickConfirm: false`).

**components/index.ts** — explicit named exports: `[Singular]Sidebar`, `[Singular]Header`.

NPC references: `screens/npc/`.

### Routes

Two new files in `src/routes/`. NPC reference: `routes/adventure.$adventureId.npc.$npcId.tsx`.

**`adventure.$adventureId.[plural].tsx`**:

```ts
import { createFileRoute } from '@tanstack/react-router';
import { [Plural]Screen } from '@/screens';
export const Route = createFileRoute('/adventure/$adventureId/[plural]')({
  component: [Plural]Screen,
});
```

**`adventure.$adventureId.[singular].$[singular]Id.tsx`**:

```ts
import { createFileRoute } from '@tanstack/react-router';
import { [Singular]Screen } from '@/screens';
export const Route = createFileRoute('/adventure/$adventureId/[singular]/$[singular]Id')({
  component: [Singular]Screen,
});
```

After creating these files, manually add the two new route entries to
`src/routeTree.gen.ts` so that `tsc --noEmit` passes during implementation.
This edit is ephemeral — `routeTree.gen.ts` is gitignored and regenerates on
dev server start.

**`screens/index.ts`** (Modified) — add two exports:

```ts
export { [Plural]Screen } from './[plural]/[Plural]Screen';
export { [Singular]Screen } from './[singular]/[Singular]Screen';
```

### Sidebar Navigation

**`app/src/components/SideBarNav/SideBarNav.tsx`** (Modified) — add a `ScreenNavBtn`
entry to the adventure-scoped button group (`<div className='sidebar-nav-btn-group'>`),
after the existing domain entries:

```tsx
<ScreenNavBtn
  label='[Plural]'
  to='/adventure/$adventureId/[plural]'
  params={{ adventureId: adventureId ?? '' }}
  isDisabled={!adventureId}
  configColor={getTableColor('[plural]')}
/>
```

### Adventure Header Stats

**`app/src/screens/adventure/components/AdventureScreenHeader/components/AdventureStats/AdventureStats.tsx`**
(Modified) — add `use[Plural]` to the `@/data-access-layer` import, call it alongside the
existing six collection hooks (`const { [plural] } = use[Plural](adventureId);`), and add
one entry to `statsMap`, after the existing domain entries:

```tsx
{ label: '[Plural]', value: [plural].length },
```

### Breadcrumbs

NPC reference: `src/components/Header/`. `BreadcrumbConfig`'s entity variant is
`{ kind: EntityType }` — fixed, not extended per domain. A new entity's kind becomes
type-permitted the moment its plural is added to `ENTITY_TYPES` (see Entity Type
Registration below); `helper/buildBreadcrumbs.ts`'s type is not touched for that reason.

**`helper/buildBreadcrumbs.ts`** (Modified) — add two cases to the `buildBreadcrumbs`
switch, returning the plural kind:

```ts
case '/adventure/$adventureId/[plural]':
  return [{ kind: 'static', label: '[Plural]',
    to: '/adventure/$adventureId/[plural]', params: { adventureId: p.adventureId } }];
case '/adventure/$adventureId/[singular]/$[singular]Id':
  return [
    { kind: 'static', label: '[Plural]', to: '/adventure/$adventureId/[plural]',
      params: { adventureId: p.adventureId } },
    { kind: '[plural]' },
  ];
```

**`helper/__tests__/buildBreadcrumbs.test.ts`** (Modified) — add test cases for both
new route IDs, asserting correct `BreadcrumbConfig[]` output.

**`components/BreadcrumbList/components/[Singular]Crumb.tsx`** (New):

```tsx
import { Link, useParams } from '@tanstack/react-router';
import { use[Singular] } from '@/data-access-layer';

export const [Singular]Crumb = () => {
  const { adventureId, [singular]Id } = useParams({ strict: false });
  const { [singular] } = use[Singular]([singular]Id ?? '', adventureId ?? '');
  return (
    <Link to='/adventure/$adventureId/[singular]/$[singular]Id'
      params={{ adventureId: adventureId ?? '', [singular]Id: [singular]Id ?? '' }}>
      {[singular]?.name ?? '…'}
    </Link>
  );
};
```

**`components/BreadcrumbList/components/index.ts`** (Modified) — add:

```ts
export { [Singular]Crumb } from './[Singular]Crumb';
```

**`components/BreadcrumbList/components/BreadcrumbListEntry.tsx`** (Modified) — the
crumb-dispatch switch lives here, not in `BreadcrumbList.tsx`. Add an import of
`[Singular]Crumb` and one case to its switch, matching the plural kind:

```ts
case '[plural]':
  crumb = <[Singular]Crumb />;
  break;
```

`BreadcrumbList.tsx` itself needs no change — it renders one `BreadcrumbListEntry` per
crumb regardless of kind.

### Seed Config

There is no `db/table-config/seed.ts` file — the initial `table_config` row for a new
domain is inserted by the same migration that creates the table, following the pattern in
`db/_migrations/1780099200000_seed_table_config.ts`'s `INSERT OR IGNORE INTO table_config`
statement. See the "Sync Registration" bullet under DB Layer Patterns above for the full
migration shape. The `TypedCreateTableConfigInput` type has no role in this flow.

```ts
const [plural]Config = {
  table_name: '[plural]',
  color: '[rgb string]',   // Provided at spec-generation time, e.g. '248, 255, 255'
  tagging_enabled: 1,      // Override per domain if needed
  scope: 'adventure',      // Override per domain if needed
  layout: {
    searchable_columns: ['name', 'summary', 'description'],
    columns: [
      { key: 'image_id', label: 'Avatar', sortable: false, resizable: false, width: 136 },
      { key: 'name', label: 'Name', width: 250 },
      { key: 'created_at', label: 'Created At', width: 250 },
      { key: 'updated_at', label: 'Last updated', width: 250 },
    ],
    sort_state: { column: 'updated_at', direction: 'desc' },
  },
};
```

### Entity Type Registration (MentionPopup, Breadcrumbs, Duplication)

Every domain entity must be registered in the following places so that `@`-mentioning it
validates, resolves live data, routes correctly, and displays the correct popup body and
deleted-mention label. This same registration also gates the Breadcrumbs section above and
the Duplication section below — it is one canonical list, not a mentioning-specific one.

**`domain/entities/entityTypes.ts`** (Modified) — add the plural table name to
`ENTITY_TYPES`:

```ts
export const ENTITY_TYPES = [
  'npcs',
  // ...existing entries...
  '[plural]',
] as const;
```

This is the canonical entity-type list — membership is not gated by `tagging_enabled`;
every domain entity belongs here regardless of that column's value (`sessions` is
registered at `tagging_enabled: 0`, for example). It gates `buildEntityPath`,
`getMentionEntityData` (the live name/deletion-status lookup used by the mention badge and
popup), `entityTypeLabel` (the deleted-mention display label and the Duplicate button's
label), and `BreadcrumbConfig`'s entity variant — `ENTITY_SEGMENT` and
`ENTITY_TYPE_LABELS` (below) are each typed `Record<EntityType, string>`, so `tsc` rejects
either file's object literal until this list includes the new type.

**`domain/entities/buildEntityPath.ts`** (Modified) — add one entry to `ENTITY_SEGMENT`:

```ts
[plural]: '[singular]',
```

Segment string is the route's singular path segment, matching the detail route file name
`adventure.$adventureId.[singular].$[singular]Id.tsx`.

**`domain/entities/entityTypeLabels.ts`** (Modified) — add one entry to
`ENTITY_TYPE_LABELS`, the label a deleted mention's hover popup shows
(`"Deleted [Label]"`) and the Duplicate button's label (`"Duplicate [Label]"`):

```ts
[plural]: '[Label]',
```

Use the singular PascalCase form (`'Foe'`) unless the entity's own name is an acronym
(`npcs`/`pcs` → `'NPC'`/`'PC'`).

**`src/components/MentionPopup/components/MentionPopupContent/components/`** (New directory) —
create `[Singular]PopupContent/[Singular]PopupContent.tsx` and
`[Singular]PopupContent/[Singular]PopupContent.css` (empty). Reference:
`NpcPopupContent/NpcPopupContent.tsx`. Substitution:
`NpcPopupContent → [Singular]PopupContent`, `useNpc → use[Singular]`,
`npc → [singular]`, `` `npc-popup-${entityId}` → `[singular]-popup-${entityId}` ``.

**`MentionPopupContent/components/index.ts`** (Modified) — add:

```ts
export { [Singular]PopupContent } from './[Singular]PopupContent/[Singular]PopupContent';
```

**`MentionPopupContent/MentionPopupContent.tsx`** (Modified) — add one case to
the `switch (entityType)` block:

```tsx
case '[plural]':
  return <[Singular]PopupContent entityId={entityId} adventureId={adventureId} />;
```

### Duplication

A standard domain entity gets a "Duplicate [Singular]" sidebar control for free once these
five points are wired. NPC reference: `db/npc/duplicate.ts`, `services/npcsService.ts`,
`domain/npcs/errors.ts`, `data-access-layer/npcs/useNpc.ts`,
`screens/components/ScreensDuplicateBtn/`.

**`db/[singular]/duplicate.ts`** (New) — `duplicate(sourceId: string, imageId: string | null): Promise<string>`.
`assertValidId(sourceId, '[Singular]')`, fetch the source row via `get(sourceId)`, throw
`new Error(\`[Singular] not found: ${sourceId}\`)` when null (an internal invariant,
exempt from the error-factory requirement), `generateId()` for the new id, then
destructure the source row to exclude `id`, `name`, `image_id`, `pinned_order`,
`created_at`, and `updated_at` into `copiedColumns`. Call
`buildDuplicateQuery('[plural]', id, copiedColumns, { image_id: imageId })` — never
hand-roll `buildCreateQuery` + `generateDbTimestamps` here, see `app/db/CLAUDE.md` —
Duplication. `name` is excluded with no override, so the duplicate's name column takes
SQL `NULL` — this is what signals to the user that duplication occurred.

**`db/[singular]/index.ts`** (Modified) — add `export { duplicate } from './duplicate';`.

**`domain/[plural]/errors.ts`** (Modified) — add `[singular]DuplicateError(id, cause?)`,
following the shape of `[singular]UpdateError` already in the file. Message:
`` `Failed to duplicate [singular]: ${String(cause)}` `` with the id included, as the
existing update-error message does.

**`domain/[plural]/index.ts`** and **`domain/index.ts`** (Modified) — add the new
type/factory exports, matching how the other four error pairs are already listed.

**`services/[plural]Service.ts`** (Modified) — add:

```ts
export const duplicate[Singular] = async (id: string): Promise<string> => {
  try {
    const source = await get[Singular]ById(id);
    const imageId = source.image_id
      ? await imageService.duplicateImage(source.image_id)
      : null;
    return await [singular]Db.duplicate(id, imageId);
  } catch (err) {
    throw [singular]DuplicateError(id, err);
  }
};
```

Image first, then the entity row — parents before children, matching
`db/_sync/registry.ts`'s declared apply order.

**`data-access-layer/[plural]/use[Singular].ts`** (Modified) — add a mutation mirroring
`deleteMutation` (no arguments, closes over `[singular]Id`) and a named wrapper returning
the new id:

```ts
const duplicateMutation = useMutation({
  mutationFn: () => service.duplicate[Singular]([singular]Id),
  onSuccess: () => {
    void queryClient.invalidateQueries({ queryKey: [singular]Keys.list(adventureId) });
  },
});
const duplicate[Singular] = async (): Promise<string> =>
  duplicateMutation.mutateAsync();
```

Only the list key is invalidated — the duplicate's own detail key holds no cached entry
yet. Add `duplicate[Singular]: () => Promise<string>` to `Use[Singular]Return` and the
returned object.

**`screens/components/ScreensDuplicateBtn/components/[Singular]DuplicateBtn.tsx`** (New) —
flat leaf component, reference: `NpcDuplicateBtn.tsx`. Reads
`useParams({ from: '/adventure/$adventureId/[singular]/$[singular]Id' })`, calls
`use[Singular]` for `duplicate[Singular]`, and on click:
`const newId = await duplicate[Singular](); await navigate({ to: buildEntityPath('[plural]', newId, adventureId), state: { focusNameInput: true } });`.

**`screens/components/ScreensDuplicateBtn/components/index.ts`** (Modified) — add the
export.

**`screens/components/ScreensDuplicateBtn/ScreensDuplicateBtn.tsx`** (Modified) — add one
case to its switch: `case '[plural]': return <[Singular]DuplicateBtn label={label} />;`.

**`[Singular]Sidebar.tsx`** (Modified) — see the Sidebar UI bullet under Frontend — Detail
Screen above; render `<ScreensDuplicateBtn entityType='[plural]' />` immediately before
the delete `Button`.

**`db/[singular]/__tests__/duplicate.test.ts`** (New) — same setup as the other
`__tests__/` files in that domain. Required assertions: omits `name`; copies every other
source column; writes the passed `imageId`, not the source's; writes `null` when passed
`null`; generates a fresh id and fresh timestamps; throws when the source row does not
exist. NPC reference: `db/npc/__tests__/duplicate.test.ts`.

No test file for the service, DAL hook, or `[Singular]DuplicateBtn.tsx` —
`app/services/` and `app/src/data-access-layer/` have no `__tests__/` convention, and
React components are exempt from unit tests.

**Entities with child rows** (a session-shaped domain owning ordered child records) need
one more file — see `db/session-step/duplicate-by-session.ts` for the pattern of
duplicating a child table via its own `duplicateBySession`-style function, called from the
parent's service-layer `duplicate[Singular]` after the parent row is duplicated. This does
not apply to standard (leaf) domains scaffolded from this document.

## Customization Points

Resolve these at spec-generation time. Provide them in the `/write-specs` prompt.

| Point | Default | Where used |
|---|---|---|
| Summary template lines | None — must specify | `db/[singular]/create.ts` |
| Table config color | None — must specify | `db/_migrations/{timestamp}_add_[plural].ts` |
| `tagging_enabled` | `1` | `db/_migrations/{timestamp}_add_[plural].ts` |
| `scope` | `'adventure'` | `db/_migrations/{timestamp}_add_[plural].ts` |
| Custom schema columns | None | `db/[singular]/schema.ts` + downstream types |
