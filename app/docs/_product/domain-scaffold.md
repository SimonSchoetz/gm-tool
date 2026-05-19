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
- Table config color: [hex string, e.g. '#e67e22']
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
| Breadcrumb kind | `'[singular lowercase]'` (string literal) | `'foe'` |
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
| `name` | `TEXT` | Yes | `z.string().optional()` | user-editable, must be nullable (auto-save rule) |
| `summary` | `TEXT` | Yes | `z.string().optional()` | Lexical JSON; template set in `create.ts` |
| `description` | `TEXT` | Yes | `z.string().optional()` | Lexical JSON; no default template |
| `image_id` | `TEXT` | Yes | `z.string().nullable().optional()` | FK → `images.id` ON DELETE SET NULL |
| `created_at` | `TEXT` NOT NULL | No | `z.string()` | ISO 8601 UTC, set in `create.ts` |
| `updated_at` | `TEXT` NOT NULL | No | `z.string()` | ISO 8601 UTC, set by `buildUpdateQuery` |

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

**`db/database.ts`** (Modified) — add schema import and register table:

```ts
import { [singular]Table } from './[singular]/schema';
// in tableSchemas array:
{ name: '[plural]', sql: [singular]Table.createTableSQL },
```

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
Loading guard: `if ([plural]Loading || configsLoading) return <div className='content-center'>Loading...</div>`.
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
`<div>Loading...</div>`. Description `TextEditor` calls `update[Singular]({ description })`.
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
`UploadImgBtn` + danger `Button label='Delete [Singular]'` via `openDeleteDialog`
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
/>
```

### Breadcrumbs

NPC reference: `src/components/Header/`.

**`helper/buildBreadcrumbs.ts`** (Modified) — extend `BreadcrumbConfig` union:

```ts
| { kind: '[singular]' }
```

Add two cases to the `buildBreadcrumbs` switch:

```ts
case '/adventure/$adventureId/[plural]':
  return [{ kind: 'static', label: '[Plural]',
    to: '/adventure/$adventureId/[plural]', params: { adventureId: p.adventureId } }];
case '/adventure/$adventureId/[singular]/$[singular]Id':
  return [
    { kind: 'static', label: '[Plural]', to: '/adventure/$adventureId/[plural]',
      params: { adventureId: p.adventureId } },
    { kind: '[singular]' },
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

**`components/BreadcrumbList/BreadcrumbList.tsx`** (Modified) — add import of `[Singular]Crumb`
and add case to `renderCrumb` switch:

```ts
case '[singular]':
  listItem = (
    <li key={`${index}-${item.kind}`}>
      <[Singular]Crumb />
    </li>
  );
  break;
```

### Seed Config

**`db/table-config/seed.ts`** (Modified) — import `[Singular]` type, add config constant,
add to `defaultConfigs` array. NPC reference: `npcsConfig` block in `seed.ts`.

```ts
import type { [Singular] } from '@db/[singular]';

const [plural]Config: TypedCreateTableConfigInput<[Singular]> = {
  table_name: '[plural]',
  color: '[hex]',          // Provided at spec-generation time
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

Add `[plural]Config` to the `defaultConfigs` array.

## Customization Points

Resolve these at spec-generation time. Provide them in the `/write-specs` prompt.

| Point | Default | Where used |
|---|---|---|
| Summary template lines | None — must specify | `db/[singular]/create.ts` |
| Table config color | None — must specify | `db/table-config/seed.ts` |
| `tagging_enabled` | `1` | `db/table-config/seed.ts` |
| `scope` | `'adventure'` | `db/table-config/seed.ts` |
| Custom schema columns | None | `db/[singular]/schema.ts` + downstream types |
