# Spec: Hooks, create.ts, and db index.ts Consistency Cleanup

## Progress tracker

- Sub-feature 1: Move `generateId` — relocate from `app/util/` to `app/db/util/`; update all create.ts imports and test mocks
- Sub-feature 2: DB create — apply `buildCreateQuery` to adventure, npc, image, table-config `create.ts` files
- Sub-feature 3: `useNpc` hook — add `adventureId` construction arg; close mutations over hook args
- Sub-feature 4: `useNpcs` hook — close `createNpc` mutation over hook's `adventureId`; drop redundant call-time arg
- Sub-feature 5: Call site updates — update all callers to match new hook signatures

## Key Architectural Decisions

### Construction-time args supply full entity context

A data-access-layer detail hook must receive every id required to fully own its invalidation responsibility at construction time. Mutation functions close over that context — they do not require callers to re-supply it at call time. The only arguments a mutation-exposing function accepts are action-specific inputs (what to change), never structural context (where to find it).

`useSession(sessionId, adventureId)` is the canonical example: `deleteSession()` takes no args because `adventureId` was supplied at construction. `useNpc(npcId)` violated this pattern by requiring `deleteNpc(adventureId)` — `adventureId` must be a hook construction arg instead.

This rule does not mean "always pass all ancestor ids." `useSessionSteps(sessionId)` correctly omits `adventureId` because session steps never invalidate anything at the adventure level. Pass every id needed to own the hook's full invalidation responsibility, nothing more.

### `useNpcs.createNpc` redundancy

`useNpcs(adventureId)` already knows `adventureId` at construction time. The prior `createNpc(adventureId)` re-required it at call time, forcing the caller to supply what the hook already owned. After this change, `createNpc()` takes no arguments.

### `generateId` belongs in `db/util/`

`generateId` is only consumed by `db/*/create.ts` files. The shared utility placement rule requires multiple consumers — a single-consumer utility belongs co-located with its consumer. Moving it to `db/util/` eliminates the cross-layer dependency on `app/util/` and leaves `app/util/` empty. `app/util/` is deleted entirely after the move.

All `create.ts` imports update from `'../../util'` (app-level util) to `'../util'` (db util). Session and session-step already import `buildCreateQuery` from `'../util'` — their two imports collapse into one. Test mocks switch from targeting `'../../../util'` (app/util) to `'../../util'` (db/util) and adopt the `importOriginal` format to preserve real `buildCreateQuery` and `defineTable` exports while overriding only `generateId`. The image test already has the correct path and format — it is unchanged.

### `db/util/index.ts` converted to explicit named exports

All four existing `export *` lines in `db/util/index.ts` are replaced with explicit named exports in this sub-feature. Every domain barrel in `db/` already uses explicit named exports — `db/util/index.ts` is the only outlier and is corrected here while the file is already open.

### `buildCreateQuery` for all DB create functions

`db/util/build-create-query.ts` builds an INSERT SQL string from a table name, an id, and a `Record<string, unknown>`, filtering out `undefined` values and always placing `id` first. The four `create.ts` files that previously built INSERT statements manually are migrated to this utility. The resulting SQL is functionally equivalent for adventure, npc, and image. For table-config, the column order changes — `id` moves from last to first — which is immaterial to SQLite.

The `npc/create.ts` merge object must add `summary: templates.summary` after spreading `validated` so that the template value is always included and any undefined `summary` from the schema parse is overridden. `buildCreateQuery` then filters remaining undefined fields automatically.

### Barrel files unchanged (DAL layer)

`app/src/data-access-layer/npcs/index.ts` exports `useNpcs`, `useNpc`, and `npcKeys` as explicit named exports — correct per convention. The hook signatures change internally but the exported symbols remain the same. No barrel modification is required.

---

## Sub-feature 1: Move `generateId`

Relocate `generateId` from `app/util/` into `app/db/util/`. Delete `app/util/` entirely. Update all consumer imports and test mocks.

### Files affected

New:

- `app/db/util/generate-id.ts`
- `app/db/util/__tests__/generate-id.test.ts`

Modified:

- `app/db/util/index.ts`
- `app/db/adventure/create.ts`
- `app/db/npc/create.ts`
- `app/db/image/create.ts`
- `app/db/session/create.ts`
- `app/db/session-step/create.ts`
- `app/db/table-config/create.ts`
- `app/db/adventure/__tests__/create.test.ts`
- `app/db/npc/__tests__/create.test.ts`
- `app/db/session/__tests__/create.test.ts`
- `app/db/session-step/__tests__/create.test.ts`
- `app/db/table-config/__tests__/create.test.ts`

Deleted:

- `app/util/generate-id/generate-id.ts`
- `app/util/generate-id/__tests__/generate-id.test.ts`
- `app/util/generate-id/` directory
- `app/util/index.ts`
- `app/util/` directory

### DB

#### `app/db/util/generate-id.ts` (new)

Copy content verbatim from `app/util/generate-id/generate-id.ts`. No content changes — this is a pure move.

#### `app/db/util/__tests__/generate-id.test.ts` (new)

Copy content verbatim from `app/util/generate-id/__tests__/generate-id.test.ts`. The relative import inside the test (`'../generate-id'`) resolves correctly from the new location — no content changes.

#### `app/db/util/index.ts`

Replace the entire file with explicit named exports. This converts all four existing `export *` lines and adds `generateId`:

```ts
export { defineTable } from './schema/define-table';
export { assertValidId, assertHasUpdateFields } from './validation';
export { buildUpdateQuery } from './build-update-query';
export { buildCreateQuery } from './build-create-query';
export { generateId } from './generate-id';
```

#### `create.ts` import updates

In each of the following files, change the `generateId` import from `'../../util'` to `'../util'`:

- `app/db/adventure/create.ts`
- `app/db/npc/create.ts`
- `app/db/image/create.ts`
- `app/db/table-config/create.ts`

For `app/db/session/create.ts` and `app/db/session-step/create.ts`, both already import `buildCreateQuery` from `'../util'`. Collapse the two separate import lines into one:

```ts
// before
import { generateId } from '../../util';
import { buildCreateQuery } from '../util';
// after
import { generateId, buildCreateQuery } from '../util';
```

#### `create.test.ts` mock updates — adventure, npc, session, session-step, table-config

For each of the five tests listed below, replace the current mock:

```ts
vi.mock('../../../util', () => ({
  generateId: vi.fn(() => 'test-generated-id'),
}));
```

with the `importOriginal` form targeting `db/util/`:

```ts
vi.mock('../../util', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../../util')>();
  return {
    ...actual,
    generateId: vi.fn(() => 'test-generated-id'),
  };
});
```

Files: `app/db/adventure/__tests__/create.test.ts`, `app/db/npc/__tests__/create.test.ts`, `app/db/session/__tests__/create.test.ts`, `app/db/session-step/__tests__/create.test.ts`, `app/db/table-config/__tests__/create.test.ts`.

`importOriginal` is required because `db/util/` also exports `buildCreateQuery` and other symbols — a full replacement mock would make those undefined. Spreading `actual` preserves the real exports; only `generateId` is overridden.

`app/db/image/__tests__/create.test.ts` is unchanged — it already mocks `'../../util'` with `importOriginal`.

No test assertion changes in this sub-feature — only the mock setup lines change.

---

## Sub-feature 2: DB create

Apply `buildCreateQuery` to the four `create.ts` files that still build INSERT SQL manually. No schema, service, or frontend changes in this sub-feature.

### Files affected

Modified:

- `app/db/adventure/create.ts`
- `app/db/npc/create.ts`
- `app/db/image/create.ts`
- `app/db/table-config/create.ts`
- `app/db/table-config/__tests__/create.test.ts`

### DB

#### `db/adventure/create.ts`

Add to existing imports:

```ts
import { buildCreateQuery } from '../util';
```

Replace the `fieldsToInsert` block and manual `columnNames` / `values` / `paramIndex` construction with:

```ts
const { sql, values } = buildCreateQuery('adventures', id, validated);
await db.execute(sql, values);
```

`validated` from `adventureTable.createSchema.parse(data)` contains only non-undefined fields. `buildCreateQuery` filters undefined values, so only the fields present in the input are inserted. Test assertions are unchanged.

#### `db/npc/create.ts`

Add to existing imports:

```ts
import { buildCreateQuery } from '../util';
```

Remove the `Npc` type from the import — it is no longer used after removing the typed `fieldsToInsert`:

```ts
// before
import type { CreateNpcInput, Npc } from './types';
// after
import type { CreateNpcInput } from './types';
```

Replace the `fieldsToInsert` block and manual column construction with:

```ts
const { sql, values } = buildCreateQuery('npcs', id, {
  ...validated,
  summary: templates.summary,
});
await db.execute(sql, values);
```

`validated` from `npcTable.createSchema.parse(data)` contains `adventure_id` and `name` when provided. Spreading `validated` first and then setting `summary: templates.summary` ensures the template is always included, overriding any undefined `summary` from the parse. The `templates` object at the top of the file is unchanged. Test assertions are unchanged.

#### `db/image/create.ts`

Add to existing imports:

```ts
import { buildCreateQuery } from '../util';
```

Replace the manual INSERT string in `db.execute`:

```ts
// before
await db.execute(
  'INSERT INTO images (id, file_extension, original_filename, file_size) VALUES ($1, $2, $3, $4)',
  [id, extension, originalFilename, fileSize],
);
// after
const { sql, values } = buildCreateQuery('images', id, {
  file_extension: extension,
  original_filename: originalFilename,
  file_size: fileSize,
});
await db.execute(sql, values);
```

All input validation logic (extension check, filePath type check, `invoke` call) is unchanged. The `image` domain has no `createSchema` — the object passed to `buildCreateQuery` is built manually from the already-validated local variables. Test assertions are unchanged.

#### `db/table-config/create.ts`

Add to existing imports:

```ts
import { buildCreateQuery } from '../util';
```

Replace the `fieldsToInsert` block and manual column construction with:

```ts
const { sql, values } = buildCreateQuery('table_config', id, validated);
await db.execute(sql, values);
```

`validated` from `tableConfigTable.createSchema.parse({ ...data, layout: JSON.stringify(layoutResult.data) })` contains `table_name`, `color`, `tagging_enabled`, `scope`, and `layout` in schema definition order. The redundant `id` and `layout: validated.layout` in the old `fieldsToInsert` are eliminated. All layout validation logic before the parse is unchanged.

The column order in the generated SQL changes — `id` moves from last to first. The test assertion must be updated.

#### `db/table-config/__tests__/create.test.ts`

Update the `mockExecute` assertion in the "should create table config and return generated ID" test:

```ts
// before
expect(mockExecute).toHaveBeenCalledWith(
  'INSERT INTO table_config (table_name, color, tagging_enabled, scope, layout, id) VALUES ($1, $2, $3, $4, $5, $6)',
  [
    'npcs',
    '#3498db',
    1,
    'adventure',
    JSON.stringify(validLayout),
    'test-generated-id',
  ],
);
// after
expect(mockExecute).toHaveBeenCalledWith(
  'INSERT INTO table_config (id, table_name, color, tagging_enabled, scope, layout) VALUES ($1, $2, $3, $4, $5, $6)',
  [
    'test-generated-id',
    'npcs',
    '#3498db',
    1,
    'adventure',
    JSON.stringify(validLayout),
  ],
);
```

The "should throw when layout is invalid" test is unchanged — `mockExecute` is not called in that case.

---

## Sub-feature 3: `useNpc` hook

Add `adventureId` as a second construction argument. Close `deleteMutation.onSuccess` and `updateMutation.onSuccess` over the hook arg instead of deriving `adventureId` from fetched data.

### Files affected

Modified:

- `app/src/data-access-layer/npcs/useNpc.ts`

### DAL

#### `useNpc.ts`

Change the hook signature:

```ts
// before
export const useNpc = (npcId: string): UseNpcReturn => {
// after
export const useNpc = (npcId: string, adventureId: string): UseNpcReturn => {
```

Change `UseNpcReturn.deleteNpc`:

```ts
// before
deleteNpc: (adventureId: string) => Promise<void>;
// after
deleteNpc: () => Promise<void>;
```

Change `deleteMutation` — `onSuccess` closes over `adventureId` from the hook arg:

```ts
const deleteMutation = useMutation({
  mutationFn: (npcId: string) => service.deleteNpc(npcId),
  onSuccess: () => {
    void queryClient.invalidateQueries({ queryKey: npcKeys.list(adventureId) });
  },
});
```

Change `deleteNpc` — no parameter, `npcId` comes from the hook's first construction arg:

```ts
const deleteNpc = async (): Promise<void> => {
  await deleteMutation.mutateAsync(npcId);
};
```

Change `updateMutation.onSuccess` — replace the conditional list invalidation that derived `adventureId` from `npcData?.adventure_id` with an unconditional invalidation using the hook arg. Remove the `if (npcData?.adventure_id)` guard entirely:

```ts
onSuccess: (_data, variables) => {
  void queryClient.invalidateQueries({ queryKey: npcKeys.detail(variables.id) });
  void queryClient.invalidateQueries({ queryKey: npcKeys.list(adventureId) });
},
```

All other code in `useNpc.ts` is unchanged: the debounce logic, the `useEffect` cleanup, the `useQuery` call, the optimistic update in `updateNpc`, and the accumulation of `pendingUpdatesRef`.

---

## Sub-feature 4: `useNpcs` hook

Close the `createNpc` mutation over the hook's `adventureId`. Drop the redundant `adventureId` call-time argument from `createNpc`.

### Files affected

Modified:

- `app/src/data-access-layer/npcs/useNpcs.ts`

### DAL

#### `useNpcs.ts`

Change `UseNpcsReturn.createNpc`:

```ts
// before
createNpc: (adventureId: string) => Promise<string>;
// after
createNpc: () => Promise<string>;
```

Change `createMutation` — `mutationFn` takes no argument and closes over `adventureId`; `onSuccess` closes over `adventureId` directly:

```ts
const createMutation = useMutation({
  mutationFn: () => service.createNpc(adventureId),
  onSuccess: () => {
    void queryClient.invalidateQueries({ queryKey: npcKeys.list(adventureId) });
  },
});
```

Change `createNpc` — no parameter, `mutateAsync` called with no argument (the mutation variable type is `void`):

```ts
const createNpc = async (): Promise<string> => createMutation.mutateAsync();
```

All other code in `useNpcs.ts` is unchanged: the `useQuery` call, the `npcs` default, and `loading`.

---

## Sub-feature 5: Call site updates

Update all three callers of `useNpc` and the single caller of `createNpc(adventureId)` / `deleteNpc(adventureId)` to match the new signatures.

### Files affected

Modified:

- `app/src/screens/npc/NpcScreen.tsx`
- `app/src/screens/npcs/NpcsScreen.tsx`
- `app/src/components/Header/Header.tsx`

### Frontend

#### `NpcScreen.tsx`

**Purpose:** NPC detail screen — displays and manages a single NPC's name, summary, description, and image. The only screen that calls `deleteNpc`.

**Behavior:** Already calls `useParams({ from: '/adventure/$adventureId/npc/$npcId' })` and destructures both `adventureId` and `npcId`. No new param extraction is needed.

Change the `useNpc` call to pass both args:

```ts
// before
const { npc, updateNpc, deleteNpc, loading } = useNpc(npcId);
// after
const { npc, updateNpc, deleteNpc, loading } = useNpc(npcId, adventureId);
```

Change `handleNpcDelete` — drop the `adventureId` argument from `deleteNpc`:

```ts
// before
const handleNpcDelete = async () => {
  await deleteNpc(adventureId);
  void router.navigate({ to: `/adventure/${adventureId}/npcs` });
};
// after
const handleNpcDelete = async () => {
  await deleteNpc();
  void router.navigate({ to: `/adventure/${adventureId}/npcs` });
};
```

No other changes.

**UI / Visual:** No visual change.

#### `NpcsScreen.tsx`

**Purpose:** NPC list screen — displays all NPCs for an adventure and handles creation.

**Behavior:** Already calls `useParams({ from: '/adventure/$adventureId/npcs' })` and destructures `adventureId`. Drop the `adventureId` argument from the `createNpc` call inside `handleNpcCreation`:

```ts
// before
const newNpcId = await createNpc(adventureId);
// after
const newNpcId = await createNpc();
```

No other changes.

**UI / Visual:** No visual change.

#### `Header.tsx`

**Purpose:** App-level header — resolves the current route via regex and displays a breadcrumb. Reads `npc.name` for display only; never calls `deleteNpc`.

**Behavior:** Already extracts `adventureId` (regex on href, falls back to `''`) and `npcId` (regex on href, falls back to `''`). Pass both to `useNpc`. When not on an NPC route, `npcId` is `''`; the hook's `enabled: !!npcId` guard prevents the query from firing regardless of the `adventureId` value.

Change the `useNpc` call:

```ts
// before
const { npc } = useNpc(npcId);
// after
const { npc } = useNpc(npcId, adventureId);
```

No other changes.

**UI / Visual:** No visual change.

---

## CLAUDE.md impact

None.
