# SF6 — Frontend switch-over

Render all six base entity types through shared screens and components, rewire every route and dispatch site to them, and remove the per-type frontend files.

## Files affected

Modified:

- `app/src/routes/adventure.$adventureId.npcs.tsx` — shared list screen and list query options
- `app/src/routes/adventure.$adventureId.pcs.tsx` — same
- `app/src/routes/adventure.$adventureId.foes.tsx` — same
- `app/src/routes/adventure.$adventureId.factions.tsx` — same
- `app/src/routes/adventure.$adventureId.locations.tsx` — same
- `app/src/routes/adventure.$adventureId.items.tsx` — same
- `app/src/screens/index.ts` — replace twelve per-type screen exports with the two shared screens
- `app/src/screens/components/ScreensDuplicateBtn/ScreensDuplicateBtn.tsx` — six cases grouped onto `BaseEntityDuplicateBtn`
- `app/src/screens/components/ScreensDuplicateBtn/components/index.ts` — replace six exports with `BaseEntityDuplicateBtn`
- `app/src/components/MentionPopup/components/MentionPopupContent/MentionPopupContent.tsx` — base types dispatch through `isBaseEntityType`; map narrowed to sessions and encounters
- `app/src/components/MentionPopup/components/MentionPopupContent/components/index.ts` — replace six exports with `BaseEntityPopupContent`
- `app/src/components/Header/components/BreadcrumbList/components/BreadcrumbListEntry.tsx` — six cases grouped onto `BaseEntityCrumb`
- `app/src/components/Header/components/BreadcrumbList/components/index.ts` — replace six exports with `BaseEntityCrumb`
- `app/src/components/Header/helper/buildBreadcrumbs.ts` — six detail route ids use `$baseEntityId`
- `app/src/components/Header/helper/__tests__/buildBreadcrumbs.test.ts` — six detail tests use the new route ids and param key
- `app/src/screens/adventure/components/AdventureScreenHeader/components/AdventureStats/AdventureStats.tsx` — six collection hooks become `useBaseEntities` calls
- `app/src/screens/npc/NpcScreen.tsx` — delete this file
- `app/src/screens/npc/components/index.ts` — delete this file
- `app/src/screens/npc/components/NpcSidebar/NpcSidebar.tsx` — delete this file
- `app/src/screens/npcs/NpcsScreen.tsx` — delete this file
- `app/src/screens/pc/PcScreen.tsx` — delete this file
- `app/src/screens/pc/components/index.ts` — delete this file
- `app/src/screens/pc/components/PcSidebar/PcSidebar.tsx` — delete this file
- `app/src/screens/pcs/PcsScreen.tsx` — delete this file
- `app/src/screens/foe/FoeScreen.tsx` — delete this file
- `app/src/screens/foe/components/index.ts` — delete this file
- `app/src/screens/foe/components/FoeSidebar/FoeSidebar.tsx` — delete this file
- `app/src/screens/foes/FoesScreen.tsx` — delete this file
- `app/src/screens/faction/FactionScreen.tsx` — delete this file
- `app/src/screens/faction/components/index.ts` — delete this file
- `app/src/screens/faction/components/FactionSidebar/FactionSidebar.tsx` — delete this file
- `app/src/screens/factions/FactionsScreen.tsx` — delete this file
- `app/src/screens/location/LocationScreen.tsx` — delete this file
- `app/src/screens/location/components/index.ts` — delete this file
- `app/src/screens/location/components/LocationSidebar/LocationSidebar.tsx` — delete this file
- `app/src/screens/locations/LocationsScreen.tsx` — delete this file
- `app/src/screens/item/ItemScreen.tsx` — delete this file
- `app/src/screens/item/components/index.ts` — delete this file
- `app/src/screens/item/components/ItemSidebar/ItemSidebar.tsx` — delete this file
- `app/src/screens/items/ItemsScreen.tsx` — delete this file
- `app/src/components/MentionPopup/components/MentionPopupContent/components/NpcPopupContent/NpcPopupContent.tsx` — delete this file
- `app/src/components/MentionPopup/components/MentionPopupContent/components/PcPopupContent/PcPopupContent.tsx` — delete this file
- `app/src/components/MentionPopup/components/MentionPopupContent/components/FoePopupContent/FoePopupContent.tsx` — delete this file
- `app/src/components/MentionPopup/components/MentionPopupContent/components/FactionPopupContent/FactionPopupContent.tsx` — delete this file
- `app/src/components/MentionPopup/components/MentionPopupContent/components/LocationPopupContent/LocationPopupContent.tsx` — delete this file
- `app/src/components/MentionPopup/components/MentionPopupContent/components/ItemPopupContent/ItemPopupContent.tsx` — delete this file
- `app/src/screens/components/ScreensDuplicateBtn/components/NpcDuplicateBtn.tsx` — delete this file
- `app/src/screens/components/ScreensDuplicateBtn/components/PcDuplicateBtn.tsx` — delete this file
- `app/src/screens/components/ScreensDuplicateBtn/components/FoeDuplicateBtn.tsx` — delete this file
- `app/src/screens/components/ScreensDuplicateBtn/components/FactionDuplicateBtn.tsx` — delete this file
- `app/src/screens/components/ScreensDuplicateBtn/components/LocationDuplicateBtn.tsx` — delete this file
- `app/src/screens/components/ScreensDuplicateBtn/components/ItemDuplicateBtn.tsx` — delete this file
- `app/src/components/Header/components/BreadcrumbList/components/NpcCrumb.tsx` — delete this file
- `app/src/components/Header/components/BreadcrumbList/components/PcCrumb.tsx` — delete this file
- `app/src/components/Header/components/BreadcrumbList/components/FoeCrumb.tsx` — delete this file
- `app/src/components/Header/components/BreadcrumbList/components/FactionCrumb.tsx` — delete this file
- `app/src/components/Header/components/BreadcrumbList/components/LocationCrumb.tsx` — delete this file
- `app/src/components/Header/components/BreadcrumbList/components/ItemCrumb.tsx` — delete this file

New:

- `app/src/screens/base-entities/BaseEntitiesScreen.tsx`
- `app/src/screens/base-entity/BaseEntityScreen.tsx`
- `app/src/screens/base-entity/components/BaseEntitySidebar/BaseEntitySidebar.tsx`
- `app/src/screens/base-entity/components/index.ts`
- `app/src/screens/components/ScreensDuplicateBtn/components/BaseEntityDuplicateBtn.tsx`
- `app/src/components/MentionPopup/components/MentionPopupContent/components/BaseEntityPopupContent/BaseEntityPopupContent.tsx`
- `app/src/components/Header/components/BreadcrumbList/components/BaseEntityCrumb.tsx`

Moved:

- `mv 'app/src/routes/adventure.$adventureId.npc.$npcId.tsx' 'app/src/routes/adventure.$adventureId.npc.$baseEntityId.tsx'`, then rewrite per Routes below with `entityType` `'npcs'`, segment `npc`
- `mv 'app/src/routes/adventure.$adventureId.pc.$pcId.tsx' 'app/src/routes/adventure.$adventureId.pc.$baseEntityId.tsx'`, then rewrite with `'pcs'`, segment `pc`
- `mv 'app/src/routes/adventure.$adventureId.foe.$foeId.tsx' 'app/src/routes/adventure.$adventureId.foe.$baseEntityId.tsx'`, then rewrite with `'foes'`, segment `foe`
- `mv 'app/src/routes/adventure.$adventureId.faction.$factionId.tsx' 'app/src/routes/adventure.$adventureId.faction.$baseEntityId.tsx'`, then rewrite with `'factions'`, segment `faction`
- `mv 'app/src/routes/adventure.$adventureId.location.$locationId.tsx' 'app/src/routes/adventure.$adventureId.location.$baseEntityId.tsx'`, then rewrite with `'locations'`, segment `location`
- `mv 'app/src/routes/adventure.$adventureId.item.$itemId.tsx' 'app/src/routes/adventure.$adventureId.item.$baseEntityId.tsx'`, then rewrite with `'items'`, segment `item`

Draft: none

No change (read to derive this SF's changes):

- `app/src/components/SideBarNav/SideBarNav.tsx` — reads colors by `table_name` strings and links to the list route ids, both unchanged
- `app/src/components/SortableList/components/SortableListItem/components/RowActionsMenu/RowActionsMenu.tsx` and `app/src/data-access-layer/pinned-order/useSetPinnedOrder.ts` — keep working because the list key keeps its `[entityType, adventureId]` shape (SF5)
- `app/src/components/MentionPopup/components/MentionPopupContent/components/EntityPopupBody/EntityPopupBody.tsx` and `app/src/components/UploadImgBtn/UploadImgBtn.tsx` — their `string | null` prop types already accept the nullable `BaseEntity` fields

`app/src/routeTree.gen.ts` is gitignored and regenerated by the Vite build. After the route moves and rewrites, run `pnpm run build:frontend` from `app/` before `npx tsc --noEmit`: until the tree is regenerated it still declares the six `$npcId`-style route ids, and every `createFileRoute('/adventure/$adventureId/npc/$baseEntityId')` call fails the type-check. At runtime in `pnpm run dev` the router plugin regenerates the tree automatically.

## Frontend

### Routes

KAD: Detail routes rename their id param to `$baseEntityId`; route files pass the entity type to shared screens. Substitution table — one row per route pair:

| `entityType` | List route file / id | Detail route file / id |
| --- | --- | --- |
| `'npcs'` | `adventure.$adventureId.npcs.tsx` / `'/adventure/$adventureId/npcs'` | `adventure.$adventureId.npc.$baseEntityId.tsx` / `'/adventure/$adventureId/npc/$baseEntityId'` |
| `'pcs'` | `adventure.$adventureId.pcs.tsx` / `'/adventure/$adventureId/pcs'` | `adventure.$adventureId.pc.$baseEntityId.tsx` / `'/adventure/$adventureId/pc/$baseEntityId'` |
| `'foes'` | `adventure.$adventureId.foes.tsx` / `'/adventure/$adventureId/foes'` | `adventure.$adventureId.foe.$baseEntityId.tsx` / `'/adventure/$adventureId/foe/$baseEntityId'` |
| `'factions'` | `adventure.$adventureId.factions.tsx` / `'/adventure/$adventureId/factions'` | `adventure.$adventureId.faction.$baseEntityId.tsx` / `'/adventure/$adventureId/faction/$baseEntityId'` |
| `'locations'` | `adventure.$adventureId.locations.tsx` / `'/adventure/$adventureId/locations'` | `adventure.$adventureId.location.$baseEntityId.tsx` / `'/adventure/$adventureId/location/$baseEntityId'` |
| `'items'` | `adventure.$adventureId.items.tsx` / `'/adventure/$adventureId/items'` | `adventure.$adventureId.item.$baseEntityId.tsx` / `'/adventure/$adventureId/item/$baseEntityId'` |

List route shape (shown for `'npcs'`):

```tsx
import { createFileRoute } from '@tanstack/react-router';
import { BaseEntitiesScreen } from '@/screens';
import {
  baseEntityListQueryOptions,
  tableConfigListQueryOptions,
} from '@/data-access-layer';

export const Route = createFileRoute('/adventure/$adventureId/npcs')({
  component: () => <BaseEntitiesScreen entityType='npcs' />,
  loader: async ({ context, params }) => {
    await Promise.all([
      context.queryClient.ensureQueryData(
        baseEntityListQueryOptions('npcs', params.adventureId),
      ),
      context.queryClient.ensureQueryData(tableConfigListQueryOptions()),
    ]);
  },
});
```

Detail route shape (shown for `'npcs'`):

```tsx
import { createFileRoute } from '@tanstack/react-router';
import { BaseEntityScreen } from '@/screens';
import {
  baseEntityQueryOptions,
  ensureImagePainted,
} from '@/data-access-layer';

export const Route = createFileRoute(
  '/adventure/$adventureId/npc/$baseEntityId',
)({
  component: () => <BaseEntityScreen entityType='npcs' />,
  loader: async ({ context, params }) => {
    const baseEntity = await context.queryClient.ensureQueryData(
      baseEntityQueryOptions('npcs', params.baseEntityId),
    );
    await ensureImagePainted(context.queryClient, baseEntity.image_id);
  },
});
```

The inline `component` arrow is route configuration, not an inline sub-component (inline rationale — KAD: Detail routes rename their id param…).

### `screens/base-entities/BaseEntitiesScreen.tsx`

**Purpose** — the sortable, searchable list for one base entity type; replaces the six `*sScreen.tsx` list screens.

**Behavior** — Reference: `app/src/screens/npcs/NpcsScreen.tsx` (validated against `.claude/rules/src-screens.md` and `.claude/rules/src-components.md`: no `cn()`, separate loading and missing-config guards, no inline sub-components). `type Props = { entityType: BaseEntityType }`, component typed `FCProps<Props>`. Reads `useParams({ strict: false })` and derives `const adventureId = params.adventureId ?? '';`. Substitutions:

| Reference | Shared |
| --- | --- |
| `useParams({ from: '/adventure/$adventureId/npcs' })` | `useParams({ strict: false })` + `adventureId` as above |
| `useNpcs(adventureId)` → `{ npcs, loading: npcsLoading, createNpc }` | `useBaseEntities(entityType, adventureId)` → `{ baseEntities, loading: baseEntitiesLoading, createBaseEntity }` |
| `tableConfigs.find((c) => c.table_name === 'npcs')` → `npcsTableConfig` | `tableConfigs.find((c) => c.table_name === entityType)` → `baseEntitiesTableConfig` |
| `handleNpcCreation` / `newNpcId` | `handleBaseEntityCreation` / `newBaseEntityId` |
| `buildEntityPath('npcs', …)` (both call sites) | `buildEntityPath(entityType, …)` |
| `tableConfigNotFoundError('npcs')` | `tableConfigNotFoundError(entityType)` |
| `SortableList<Npc>` with `items={npcs}`, row param `npc` | `SortableList<BaseEntity>` with `items={baseEntities}`, row param `baseEntity` |
| `searchPlaceholder='e.g. "name, profession, some text in description"'` | `` searchPlaceholder={`e.g. "name, ${baseEntitySearchHint(entityType)}, some text in description"`} `` |

Imports: `buildEntityPath`, `baseEntitySearchHint`, and `type BaseEntityType` from `'@domain'`; `type BaseEntity` from `'@db/base-entity'`; `useBaseEntities`, `useTableConfigs` from `'@/data-access-layer'`. Loading and error states are unchanged from the reference.

**UI / Visual** — identical to the reference: `LoadingIcon` inside `content-center` while loading, otherwise one `SortableList`. No CSS file.

### `screens/base-entity/BaseEntityScreen.tsx`

**Purpose** — the detail view for one base entity; replaces the six `*Screen.tsx` detail screens.

**Behavior** — Reference: `app/src/screens/npc/NpcScreen.tsx` (validated: composes `ScreensTextEditorLayout`, no `cn()`, no inline sub-components). `type Props = { entityType: BaseEntityType }`, `FCProps<Props>`. Reads `const params = useParams({ strict: false });` and calls `useBaseEntity(entityType, params.baseEntityId ?? '', params.adventureId ?? '')`. Let `label = entityTypeLabel(entityType)`. Substitutions:

| Reference | Shared |
| --- | --- |
| `const { npc, updateNpc, loading } = useNpc(npcId, adventureId)` | `const { baseEntity, updateBaseEntity, loading } = useBaseEntity(…)` as above |
| `sideBar={<NpcSidebar />}` | `sideBar={<BaseEntitySidebar entityType={entityType} />}` |
| `placeholder='NPC Summary'` | `` placeholder={`${label} Summary`} `` |
| `` textEditorId={`NPC_${npc.id}_summary`} `` | `` textEditorId={`${entityType}_${baseEntity.id}_summary`} `` |
| `placeholder='NPC Name'` | `` placeholder={`${label} Name`} `` |
| `` textEditorId={`NPC_${npc.id}_description`} `` | `` textEditorId={`${entityType}_${baseEntity.id}_description`} `` |
| `updateNpc({ … })`, `npc.summary ?? ''`, `npc.name ?? ''`, `npc.description ?? ''` | `updateBaseEntity({ … })`, `baseEntity.summary ?? ''`, `baseEntity.name ?? ''`, `baseEntity.description ?? ''` |

`?? ''` stays: `TextEditor` `value` and `ScreensNameInput` `initValue` take a string, and the conversion from a nullable column to "nothing displayed" is the documented boundary in `.claude/rules/src-components.md` — Controlled inputs. Imports: `entityTypeLabel`, `type BaseEntityType` from `'@domain'`; `BaseEntitySidebar` from `'./components'`. `entityType` is passed to `BaseEntitySidebar` as a prop because it is not a URL param (inline rationale — KAD: Detail routes rename their id param…). Loading and null guards are unchanged from the reference.

**UI / Visual** — identical to the reference: `ScreensTextEditorLayout` with the sidebar, the summary editor in `ScreensSummary` as header, and the name input plus description editor as body. No CSS file.

### `screens/base-entity/components/BaseEntitySidebar/BaseEntitySidebar.tsx`

**Purpose** — the image, duplicate, and delete controls beside a base entity's detail view; replaces the six `*Sidebar.tsx`.

**Behavior** — Reference: `app/src/screens/npc/components/NpcSidebar/NpcSidebar.tsx` (validated: bare `return;` guard, `openDeleteDialog` with `oneClickConfirm: false`). `type Props = { entityType: BaseEntityType }`, `FCProps<Props>`. Reads `const params = useParams({ strict: false });` with `const adventureId = params.adventureId ?? '';` and calls `useBaseEntity(entityType, params.baseEntityId ?? '', adventureId)`. Substitutions:

| Reference | Shared |
| --- | --- |
| `useNpc(npcId, adventureId)` → `{ npc, updateNpc, deleteNpc, removeNpcImage }` | `useBaseEntity(…)` → `{ baseEntity, updateBaseEntity, deleteBaseEntity, removeBaseEntityImage }` |
| `if (!npc) return;` | `if (!baseEntity) return;` |
| `handleNpcDelete`: ``await deleteNpc(); void router.navigate({ to: `/adventure/${adventureId}/npcs` })`` | `handleBaseEntityDelete`: `await deleteBaseEntity(); void router.navigate({ to: buildBaseEntityListPath(entityType, adventureId) })` |
| `image_id={npc.image_id ?? null}` | `image_id={baseEntity.image_id}` |
| `updateNpc({ imgFilePath: filePath, image_id: npc.image_id })` | `updateBaseEntity({ imgFilePath: filePath, image_id: baseEntity.image_id })` |
| `if (npc.image_id) void removeNpcImage();` | `if (baseEntity.image_id) void removeBaseEntityImage();` |
| `<ScreensDuplicateBtn entityType='npcs' />` | `<ScreensDuplicateBtn entityType={entityType} />` |
| `label='Delete NPC'` | `` label={`Delete ${entityTypeLabel(entityType)}`} `` |
| `name: npc.name ?? ''` | `name: baseEntity.name ?? ''` |

Imports: `buildBaseEntityListPath`, `entityTypeLabel`, `type BaseEntityType` from `'@domain'`; `PREVIEW_HEIGHT`, `PREVIEW_WIDTH` from `'../../../screens.constants'`; `ScreensDuplicateBtn`, `ScreensSidebar` from `'../../../components'` — both paths resolve from the new file exactly as they do from `NpcSidebar.tsx`, which sits at the same depth.

**UI / Visual** — identical to the reference: `ScreensSidebar` containing `UploadImgBtn`, then `ScreensDuplicateBtn`, then the danger `Button`. No CSS file.

### `screens/base-entity/components/index.ts`

`export { BaseEntitySidebar } from './BaseEntitySidebar/BaseEntitySidebar';` — explicit, flat sub-component per `.claude/rules/src-components.md`.

### `screens/index.ts`

Replace lines 7–18 (the twelve per-type exports) with:

- `export { BaseEntitiesScreen } from './base-entities/BaseEntitiesScreen';`
- `export { BaseEntityScreen } from './base-entity/BaseEntityScreen';`

### `screens/components/ScreensDuplicateBtn/components/BaseEntityDuplicateBtn.tsx`

**Purpose** — the duplicate button for any base entity; replaces the six per-type duplicate buttons.

**Behavior** — Reference: `app/src/screens/components/ScreensDuplicateBtn/components/NpcDuplicateBtn.tsx` (validated). `type Props = { entityType: BaseEntityType; label: string }`, `FCProps<Props>`. Reads `const params = useParams({ strict: false });` with `const adventureId = params.adventureId ?? '';`, calls `useBaseEntity(entityType, params.baseEntityId ?? '', adventureId)` for `duplicateBaseEntity`, and on click awaits `duplicateBaseEntity()`, then `navigate({ to: buildEntityPath(entityType, newId, adventureId), state: { focusNameInput: true } })`. Imports `buildEntityPath`, `type BaseEntityType` from `'@domain'`.

**UI / Visual** — one `Button` with the passed `label`, as in the reference.

### `ScreensDuplicateBtn.tsx`

Imports: remove the six per-type buttons from the `'./components'` import and add `BaseEntityDuplicateBtn`. In the switch, replace the six per-type cases with grouped labels sharing one body:

```tsx
    case 'npcs':
    case 'pcs':
    case 'foes':
    case 'factions':
    case 'locations':
    case 'items':
      return <BaseEntityDuplicateBtn entityType={entityType} label={label} />;
```

The `sessions`, `encounters`, and `adventures` cases and the line-16 comment are unchanged (KAD: Dispatch sites…). The existing `case 'adventures': return null;` is a component render return, not a `void` context, so the `return null` scan item does not apply.

### `ScreensDuplicateBtn/components/index.ts`

Remove the `NpcDuplicateBtn`, `PcDuplicateBtn`, `FoeDuplicateBtn`, `FactionDuplicateBtn`, `LocationDuplicateBtn`, `ItemDuplicateBtn` lines; add `export { BaseEntityDuplicateBtn } from './BaseEntityDuplicateBtn';` as the first line.

### `MentionPopupContent/components/BaseEntityPopupContent/BaseEntityPopupContent.tsx`

**Purpose** — the mention popup body for any base entity; replaces the six per-type popup contents.

**Behavior** — Reference: `NpcPopupContent/NpcPopupContent.tsx` (validated). `type Props = { entityType: BaseEntityType; entityId: string; adventureId: string | null }`, `FCProps<Props>`. Calls `useBaseEntity(entityType, entityId, adventureId ?? '')`; returns bare when `loading || !baseEntity`. `entityId` and `adventureId` come from props because the popup is not rendered under the entity's route, exactly as in the reference. Imports `EntityPopupBody` from `'../EntityPopupBody'`, `useBaseEntity` from `'@/data-access-layer'`, `type BaseEntityType` from `'@domain/entities'`.

**UI / Visual** — ``<EntityPopupBody summary={baseEntity.summary} imageId={baseEntity.image_id} textEditorId={`${entityType}-popup-${entityId}`} />``. `summary` and `imageId` pass directly: both props are typed `string | null` (`EntityPopupBody.tsx:7-11`). No CSS file.

### `MentionPopupContent.tsx`

- Add `import { isBaseEntityType, type BaseEntityType } from '@domain/entities';`.
- Replace the six per-type component imports with `BaseEntityPopupContent`.
- `popupContentMap` becomes `Record<Exclude<MentionEntityType, BaseEntityType>, FCProps<PopupContentProps>>` with only `sessions: SessionPopupContent` and `encounters: EncounterPopupContent`.
- Replace its comment with one line stating that the map is keyed by the non-base mentionable types (`domain/mentions/mentionEntityType.ts` minus `domain/entities/entityTypes.ts`'s base types) so a non-base mentionable entity added there and not here fails to compile, and that base entity types dispatch through `isBaseEntityType` above.
- As the first statement of the component body: `if (isBaseEntityType(entityType)) return <BaseEntityPopupContent entityType={entityType} entityId={entityId} adventureId={adventureId} />;`. The existing `popupContentByType` lookup, its bare-`return` guard, and the final render follow unchanged.

The component calls no hooks, so the early return does not change hook order.

### `MentionPopupContent/components/index.ts`

Remove the `NpcPopupContent`, `FoePopupContent`, `PcPopupContent`, `FactionPopupContent`, `LocationPopupContent`, `ItemPopupContent` lines; add `export { BaseEntityPopupContent } from './BaseEntityPopupContent/BaseEntityPopupContent';` as the first line.

### `BreadcrumbList/components/BaseEntityCrumb.tsx`

**Purpose** — the header crumb showing a base entity's live name; replaces the six per-type crumbs.

**Behavior** — Reference: `NpcCrumb.tsx` (validated). `type Props = { entityType: BaseEntityType }`, `FCProps<Props>` (the zero-props exception no longer applies). Reads `const params = useParams({ strict: false });`, derives `baseEntityId = params.baseEntityId ?? ''` and `adventureId = params.adventureId ?? ''`, and calls `useBaseEntity(entityType, baseEntityId, adventureId)`. Imports `buildEntityPath`, `type BaseEntityType` from `'@domain'`; `useBaseEntity` from `'@/data-access-layer'`.

**UI / Visual** — `<Link to={buildEntityPath(entityType, baseEntityId, adventureId)}>{baseEntity?.name ?? '…'}</Link>` — the same destination URL the typed per-route link produced, passed as a plain string (verified form — KAD: Detail routes rename their id param…).

### `BreadcrumbListEntry.tsx`

Remove the six per-type crumb imports; add `import { BaseEntityCrumb } from './BaseEntityCrumb';`. In the switch, replace the `npcs`, `foes`, `items`, `factions`, `pcs`, and `locations` cases with grouped labels sharing one body: `crumb = <BaseEntityCrumb entityType={config.kind} />; break;`. `config.kind` narrows to the six-member union inside grouped labels (KAD: Dispatch sites…). The `adventures`, `sessions`, and `encounters` cases are unchanged.

### `BreadcrumbList/components/index.ts`

Remove the `NpcCrumb`, `FoeCrumb`, `ItemCrumb`, `PcCrumb`, `FactionCrumb`, `LocationCrumb` lines; add `export { BaseEntityCrumb } from './BaseEntityCrumb';` after `EncounterCrumb`.

### `helper/buildBreadcrumbs.ts`

Change only the six detail case labels: `'/adventure/$adventureId/npc/$npcId'` → `'/adventure/$adventureId/npc/$baseEntityId'`, and likewise for `foe/$foeId`, `item/$itemId`, `faction/$factionId`, `pc/$pcId`, `location/$locationId`. Every returned config is unchanged. A stale label makes the route fall through to `default: return []`, silently dropping the crumbs — the test update below covers each renamed id.

### `helper/__tests__/buildBreadcrumbs.test.ts`

In the six detail tests (npc at line 68, foe at 170, pc at 204, faction at 238, location at 272, item at 306), change the route id passed to `match` and the test title to the `$baseEntityId` form, and rename the params key (`npcId`, `foeId`, `pcId`, `factionId`, `locationId`, `itemId`) to `baseEntityId`, keeping each value. Every `toHaveLength` and `toEqual` assertion is unchanged.

### `AdventureStats.tsx`

Replace the `usePcs`, `useNpcs`, `useFactions`, `useLocations`, `useFoes`, `useItems` imports with `useBaseEntities`, and the six calls with `const { baseEntities: pcs } = useBaseEntities('pcs', adventureId);`, then the same for `npcs`, `factions`, `locations`, `foes`, `items`, in the current order. `statsMap` and everything else are unchanged.

### Modified-file scan

- `MentionPopupContent.tsx`, `ScreensDuplicateBtn.tsx`, `BreadcrumbListEntry.tsx`, `AdventureStats.tsx`: no inline sub-component, and no `return null` in a `void` context.
- The six list route files: the inline `component` arrow is addressed by KAD: Detail routes rename their id param….
- `buildBreadcrumbs.ts`, its test, and the three barrels: no violation.

### Runtime verification

These screens read the database, which only `pnpm run dev` can reach; the React components have no unit tests under `app/src/CLAUDE.md` — Testing Policy. After this SF, run `pnpm run dev` against a database that already holds rows of all six types. For each type, confirm:

- existing rows appear in the list after the migration
- creating a row navigates to its detail view with the default name
- renaming, and editing summary and description, persist across navigation
- uploading an image and removing it both work
- duplicating opens the copy with its name focused
- pinning and unpinning from the list row menu reorder the list
- deleting returns to that type's list
- an `@`-mention of the type opens the popup with summary and image, and a deleted one shows `Deleted <Label>`
- the header crumb shows the live name
