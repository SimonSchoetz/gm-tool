# SF6 — Entity-type registration and ambient systems

Registers `encounters` as a canonical entity type and wires it into every ambient system that handles all entities: breadcrumbs, the `@`-mention hover popup, the shared duplicate control, the sidebar navigation, and the adventure stats row.

`[FOUNDATION: SF5 depends on this. Stage as unit: app/src/routes/adventure.$adventureId.encounters.tsx, app/src/routes/adventure.$adventureId.encounter.$encounterId.tsx, app/src/screens/encounters/EncountersScreen.tsx, app/src/screens/encounter/EncounterScreen.tsx, app/src/screens/encounter/EncounterScreen.css, app/src/screens/encounter/components/EncounterHeader.tsx, app/src/screens/encounter/components/EncounterSidebar.tsx, app/src/screens/encounter/components/EncounterSidebar.css, app/src/screens/encounter/components/index.ts, app/src/screens/index.ts, app/domain/entities/entityTypes.ts, app/domain/entities/buildEntityPath.ts, app/domain/entities/entityTypeLabels.ts, app/domain/entities/__tests__/buildEntityPath.test.ts, app/domain/entities/__tests__/entityTypeLabels.test.ts, app/src/components/Header/helper/buildBreadcrumbs.ts, app/src/components/Header/helper/__tests__/buildBreadcrumbs.test.ts, app/src/components/Header/components/BreadcrumbList/components/EncounterCrumb.tsx, app/src/components/Header/components/BreadcrumbList/components/BreadcrumbListEntry.tsx, app/src/components/Header/components/BreadcrumbList/components/index.ts, app/src/components/MentionPopup/components/MentionPopupContent/components/EncounterPopupContent/EncounterPopupContent.tsx, app/src/components/MentionPopup/components/MentionPopupContent/components/index.ts, app/src/components/MentionPopup/components/MentionPopupContent/MentionPopupContent.tsx, app/src/screens/components/ScreensDuplicateBtn/components/EncounterDuplicateBtn.tsx, app/src/screens/components/ScreensDuplicateBtn/components/index.ts, app/src/screens/components/ScreensDuplicateBtn/ScreensDuplicateBtn.tsx, app/src/components/SideBarNav/SideBarNav.tsx, app/src/screens/adventure/components/AdventureScreenHeader/components/AdventureStats/AdventureStats.tsx, app/docs/_product/domain-scaffold.md]`

Do not run baseline checks after SF5 alone — run only after SF5 and SF6 are both complete. SF5 is the dependent: its `EncounterSidebar` passes `entityType='encounters'` to a prop typed `EntityType`, which this sub-feature's first edit creates.

## Files affected

New:

- `app/src/components/Header/components/BreadcrumbList/components/EncounterCrumb.tsx`
- `app/src/components/MentionPopup/components/MentionPopupContent/components/EncounterPopupContent/EncounterPopupContent.tsx`
- `app/src/screens/components/ScreensDuplicateBtn/components/EncounterDuplicateBtn.tsx`

Modified:

- `app/domain/entities/entityTypes.ts` — add the type to `ENTITY_TYPES`
- `app/domain/entities/buildEntityPath.ts` — add the `ENTITY_SEGMENT` entry
- `app/domain/entities/entityTypeLabels.ts` — add the `ENTITY_TYPE_LABELS` entry
- `app/domain/entities/__tests__/buildEntityPath.test.ts` — add one path assertion
- `app/domain/entities/__tests__/entityTypeLabels.test.ts` — the `'returns the display label for each known entity type'` test enumerates every member and becomes incomplete once the union grows
- `app/src/components/Header/helper/buildBreadcrumbs.ts` — add two route cases
- `app/src/components/Header/helper/__tests__/buildBreadcrumbs.test.ts` — add two route-mapping tests
- `app/src/components/Header/components/BreadcrumbList/components/BreadcrumbListEntry.tsx` — add the crumb-dispatch case
- `app/src/components/Header/components/BreadcrumbList/components/index.ts` — export `EncounterCrumb`
- `app/src/components/MentionPopup/components/MentionPopupContent/MentionPopupContent.tsx` — add the popup case
- `app/src/components/MentionPopup/components/MentionPopupContent/components/index.ts` — export `EncounterPopupContent`
- `app/src/screens/components/ScreensDuplicateBtn/ScreensDuplicateBtn.tsx` — add the duplicate-button case
- `app/src/screens/components/ScreensDuplicateBtn/components/index.ts` — export `EncounterDuplicateBtn`
- `app/src/components/SideBarNav/SideBarNav.tsx` — add the nav entry
- `app/src/screens/adventure/components/AdventureScreenHeader/components/AdventureStats/AdventureStats.tsx` — add the stat entry, plus the cleanup below
- `app/docs/_product/domain-scaffold.md` — registration correction, enumerated at the end of this file

## Domain layer

### `app/domain/entities/entityTypes.ts`

Insert `'encounters',` into `ENTITY_TYPES` directly after `'sessions',` — before `'adventures'`, keeping the adventure-scoped types grouped ahead of the single global-scoped one. Membership here is not gated by `tagging_enabled`; it is the canonical list that types `EntityType`, backs `isEntityType`, and keys both `Record<EntityType, string>` lookup tables below.

This one edit produces exactly three `tsc` errors until the rest of this sub-feature lands — the two `Record` literals below and `BreadcrumbListEntry.tsx`'s definite-assignment analysis. Nothing else in the codebase breaks; see the root spec's Foundation decision for the full measurement.

### `app/domain/entities/buildEntityPath.ts`

Add `encounters: 'encounter',` to `ENTITY_SEGMENT`, in the position matching the `ENTITY_TYPES` order. The segment is the singular route path segment, matching the detail route file name `adventure.$adventureId.encounter.$encounterId.tsx`.

### `app/domain/entities/entityTypeLabels.ts`

Add `encounters: 'Encounter',` to `ENTITY_TYPE_LABELS`, in the same position. This label is what a deleted mention's popup shows as `"Deleted Encounter"` and what `ScreensDuplicateBtn` renders as `"Duplicate Encounter"`.

## Frontend

### `app/src/components/Header/helper/buildBreadcrumbs.ts`

Add two cases to the `buildBreadcrumbs` switch, placed after the `'/adventure/$adventureId/session/$sessionId'` case to mirror the `ENTITY_TYPES` ordering:

- `case '/adventure/$adventureId/encounters':` returns a single static crumb `{ kind: 'static', label: 'Encounters', to: '/adventure/$adventureId/encounters', params: { adventureId: p.adventureId } }`.
- `case '/adventure/$adventureId/encounter/$encounterId':` returns that same static crumb followed by `{ kind: 'encounters' }`.

`BreadcrumbConfig`'s entity variant is `{ kind: EntityType }` and needs no change — the new kind became type-permitted the moment `ENTITY_TYPES` grew.

### `app/src/components/Header/components/BreadcrumbList/components/EncounterCrumb.tsx`

**Purpose** — renders the encounter's live name as the trailing breadcrumb on the detail route.

**Behavior** — pure substitution from `app/src/components/Header/components/BreadcrumbList/components/FoeCrumb.tsx`: `FoeCrumb` → `EncounterCrumb`, `useFoe` → `useEncounter`, `foeId` → `encounterId`, `foe` → `encounter`, `'/adventure/$adventureId/foe/$foeId'` → `'/adventure/$adventureId/encounter/$encounterId'`. Reads `useParams({ strict: false })` because the component renders outside the route's own subtree, and falls back to `''` for both ids.

**UI / Visual** — a `<Link>` whose child is `{encounter?.name ?? '…'}`. The ellipsis is the placeholder while the detail query resolves, and also what a never-named encounter shows. No props, so the component takes no `FCProps` annotation per the zero-props exception; no CSS file.

### `app/src/components/Header/components/BreadcrumbList/components/BreadcrumbListEntry.tsx`

Import `EncounterCrumb` alongside the other crumb imports and add `case 'encounters': crumb = <EncounterCrumb />; break;` to the `switch (config.kind)` block, after the `'sessions'` case. Until this case exists, `crumb` is reachable unassigned and `tsc` reports TS2454 at the `<BreadcrumbListItem>{crumb}</BreadcrumbListItem>` line.

### `app/src/components/Header/components/BreadcrumbList/components/index.ts`

Add `export { EncounterCrumb } from './EncounterCrumb';` after the `SessionCrumb` line. Explicit named export, matching every other line.

### `app/src/components/MentionPopup/.../components/EncounterPopupContent/EncounterPopupContent.tsx`

**Purpose** — the body of the hover popup shown when an `@`-mention of an encounter is hovered. Encounters are mentionable because SF1's table config sets `tagging_enabled: 1`.

**Behavior** — substitution from `app/src/components/MentionPopup/components/MentionPopupContent/components/SessionPopupContent/SessionPopupContent.tsx`, the image-less reference: `SessionPopupContent` → `EncounterPopupContent`, `useSession` → `useEncounter`, `session` → `encounter`, `` `session-popup-${entityId}` `` → `` `encounter-popup-${entityId}` ``. Props are `{ entityId: string; adventureId: string | null }`; the hook is called as `useEncounter(entityId, adventureId ?? '')`; the guard is `if (loading || !encounter) return;`.

**UI / Visual** — renders `EntityPopupBody` (imported via the direct relative path `'../EntityPopupBody'`, never through the sibling grouping barrel) with `summary={encounter.description ?? null}`, `imageId={null}`, and the `textEditorId` above. Passing `description` into the `summary` slot is deliberate: that prop is the popup's read-only rich-text preview slot, and `description` is the only rich text an encounter has — see the root spec's mention-popup decision. One divergence from the session reference: no `.css` file is created and no CSS import is written, because the component owns no styles. `SessionPopupContent.css`, `FoePopupContent.css`, `FactionPopupContent.css`, `ItemPopupContent.css`, `LocationPopupContent.css`, and `PcPopupContent.css` are all zero-byte files that predate `app/src/CLAUDE.md`'s ban on speculative placeholders; `NpcPopupContent.css` is the one popup stylesheet with actual content.

### `app/src/components/MentionPopup/.../components/index.ts`

Add `export { EncounterPopupContent } from './EncounterPopupContent/EncounterPopupContent';` after the `SessionPopupContent` line.

### `app/src/components/MentionPopup/.../MentionPopupContent.tsx`

Add `EncounterPopupContent` to the existing `from './components'` import and add a case to the `switch (entityType)` block, after `'sessions'`:

```tsx
case 'encounters':
  return <EncounterPopupContent entityId={entityId} adventureId={adventureId} />;
```

The switch is over `entityType: string` with a `default: return;`, so this addition is a functional fix rather than a compile fix: without it a mentioned encounter's popup renders its header with no body.

### `app/src/screens/components/ScreensDuplicateBtn/components/EncounterDuplicateBtn.tsx`

**Purpose** — the encounter-specific leaf of the shared duplicate control, rendered by `ScreensDuplicateBtn` and placed in the detail sidebar by SF5.

**Behavior** — pure substitution from `app/src/screens/components/ScreensDuplicateBtn/components/SessionDuplicateBtn.tsx`: `SessionDuplicateBtn` → `EncounterDuplicateBtn`, `useSession` → `useEncounter`, `sessionId` → `encounterId`, `duplicateSession` → `duplicateEncounter`, `'sessions'` → `'encounters'`, and the route id in `useParams({ from: ... })` → `'/adventure/$adventureId/encounter/$encounterId'`. On click it awaits `duplicateEncounter()` for the new id, then navigates to `buildEntityPath('encounters', newId, adventureId)` with `state: { focusNameInput: true }` so the duplicate — which SF1's `duplicate.ts` leaves nameless — arrives with its name field focused.

**UI / Visual** — a single `Button` taking the `label` prop supplied by the parent switch; the `onClick` wraps the async handler in `void` to satisfy `@typescript-eslint/no-misused-promises`. Props are `{ label: string }` typed via `FCProps<Props>`. No CSS file.

### `app/src/screens/components/ScreensDuplicateBtn/components/index.ts`

Add `export { EncounterDuplicateBtn } from './EncounterDuplicateBtn';` after the `SessionDuplicateBtn` line.

### `app/src/screens/components/ScreensDuplicateBtn/ScreensDuplicateBtn.tsx`

Add `EncounterDuplicateBtn` to the `from './components'` import and add `case 'encounters': return <EncounterDuplicateBtn label={label} />;` after the `'sessions'` case. The file's existing comment describes this switch as the single declaration of what can be duplicated, which is why the control is placed in every sidebar unconditionally; leave that comment unchanged.

### `app/src/components/SideBarNav/SideBarNav.tsx`

Insert a new `<li>` between the `Sessions` and `PCs` entries in the `sidebar-nav--btn-group` list:

```tsx
<li>
  <ScreenNavBtn
    label='Encounters'
    to='/adventure/$adventureId/encounters'
    isDisabled={!adventureId}
    configColor={getTableColor('encounters')}
  />
</li>
```

`getTableColor('encounters')` resolves to `'248, 255, 255'` from the `table_config` row SF1's migration inserts, and returns `''` before that migration has run. The existing adventure-scoped entries pass no `params` prop, so this one does not either.

### `app/src/screens/adventure/.../AdventureStats/AdventureStats.tsx`

Two changes.

First, the stat entry: add `useEncounters` to the `@/data-access-layer` import, call `const { encounters } = useEncounters(adventureId);` alongside the existing seven collection hooks, and insert `{ label: 'Encounters', value: encounters.length },` into `statsMap` directly after the `Sessions` entry — matching the sidebar navigation order.

Second, a cleanup required by root CLAUDE.md's fix-violations-in-files-you-touch rule: the component declares `type Props = object;` and is typed `FCProps<Props>` while accepting no external props, which `app/src/CLAUDE.md`'s zero-props exception explicitly forbids. Delete the `type Props = object;` line, change the declaration to `export const AdventureStats = () => {`, and remove the now-unused `import { FCProps } from '@/types';` line — `FCProps` has no other use in the file.

## Tests

### `app/domain/entities/__tests__/buildEntityPath.test.ts`

Add one test after the session case:

```ts
it('returns adventure-scoped encounter path', () => {
  expect(buildEntityPath('encounters', 'encounter-1', 'adv-1')).toBe(
    '/adventure/adv-1/encounter/encounter-1',
  );
});
```

### `app/domain/entities/__tests__/entityTypeLabels.test.ts`

Add `expect(entityTypeLabel('encounters')).toBe('Encounter');` to the existing `'returns the display label for each known entity type'` test, after the `sessions` assertion. That test asserts one label per member of the union, so it is incomplete — not merely unextended — once `ENTITY_TYPES` grows.

### `app/src/components/Header/helper/__tests__/buildBreadcrumbs.test.ts`

Add two tests, mirroring the existing `foes` pair in shape. Both build their match list with the file's local `match(routeId, params)` helper.

- `'maps /adventure/$adventureId/encounters to Encounters static'` — matches `['__root__', '/adventure/$adventureId', '/adventure/$adventureId/encounters']` with `{ adventureId: 'adv-1' }` on the latter two, asserts `toHaveLength(3)`, and asserts `result[2]` equals `{ kind: 'static', label: 'Encounters', to: '/adventure/$adventureId/encounters', params: { adventureId: 'adv-1' } }`.
- `'maps /adventure/$adventureId/encounter/$encounterId to Encounters static + encounter crumb'` — appends a fourth match for `'/adventure/$adventureId/encounter/$encounterId'` with `{ adventureId: 'adv-1', encounterId: 'enc-1' }`, asserts `toHaveLength(4)`, asserts `result[2]` equals the same static crumb, and asserts `result[3]` equals `{ kind: 'encounters' }`.

No component tests: `EncounterCrumb`, `EncounterPopupContent`, and `EncounterDuplicateBtn` all return JSX and are barred from unit tests by `app/src/CLAUDE.md` — Testing Policy.

## `domain-scaffold.md` correction in this sub-feature

Apply this edit to `app/docs/_product/domain-scaffold.md` as part of SF6:

- **Entity Type Registration section** — the `[Singular]PopupContent` bullet instructs the implementer to create `[Singular]PopupContent/[Singular]PopupContent.css` (empty). Remove the `.css` file from that instruction and note that the popup content component owns no styles, so it gets no CSS file and no CSS import; the six zero-byte popup stylesheets that currently exist predate `app/src/CLAUDE.md`'s ban on speculative placeholder CSS and must not be replicated. The bullet's named reference is `NpcPopupContent.tsx`; keep it as the substitution reference but state that its sibling `NpcPopupContent.css` is the one popup stylesheet with real content, so its presence is not evidence that a new popup component needs one.
