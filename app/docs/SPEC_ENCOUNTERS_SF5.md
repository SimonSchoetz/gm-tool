# SF5 — Routes and screens: list screen, minimal detail screen

Adds both routes and both screens. The list screen follows the established sortable-list pattern; the detail screen is a deliberately minimal base for a future encounter-specific screen and follows `SessionScreen`'s stacked layout rather than the shared `ScreensTextEditorLayout` (see the root spec's detail-screen decision).

This sub-feature does not type-check on its own: `EncounterSidebar` passes `entityType='encounters'` to `ScreensDuplicateBtn`, whose prop is typed `EntityType`, and `'encounters'` becomes a member of that union only in SF6. SF6 carries the `[FOUNDATION]` annotation and the combined staging list; run baseline checks only after SF6 is complete.

## Files affected

New:

- `app/src/routes/adventure.$adventureId.encounters.tsx`
- `app/src/routes/adventure.$adventureId.encounter.$encounterId.tsx`
- `app/src/screens/encounters/EncountersScreen.tsx`
- `app/src/screens/encounter/EncounterScreen.tsx`
- `app/src/screens/encounter/EncounterScreen.css`
- `app/src/screens/encounter/components/EncounterHeader.tsx`
- `app/src/screens/encounter/components/EncounterSidebar.tsx`
- `app/src/screens/encounter/components/EncounterSidebar.css`
- `app/src/screens/encounter/components/index.ts`

Modified:

- `app/src/screens/index.ts` — add the two screen exports
- `app/src/routeTree.gen.ts` — regenerated automatically by `npm run build:frontend`; needs no manual authoring and is not committed (gitignored at `app/.gitignore:30`)
- `app/docs/_product/domain-scaffold.md` — frontend corrections, enumerated at the end of this file

No `EncountersScreen.css` is created — see the root spec's decision on the absent companion CSS file.

## Frontend

### `app/src/routes/adventure.$adventureId.encounters.tsx`

Three lines, matching every existing list route file: import `createFileRoute` from `@tanstack/react-router`, import `EncountersScreen` from `@/screens`, and export `Route = createFileRoute('/adventure/$adventureId/encounters')({ component: EncountersScreen })`.

### `app/src/routes/adventure.$adventureId.encounter.$encounterId.tsx`

Same shape with `EncounterScreen` and the route id `'/adventure/$adventureId/encounter/$encounterId'`.

After both files exist, run `npm run build:frontend` once from `app/`. The `tanstackRouter` plugin registered in `app/vite.config.ts` rewrites `src/routeTree.gen.ts` from the route files during the build, which is what makes the two new route ids available to `useParams({ from: ... })` and to typed `<Link to=... />` in this sub-feature and in SF6. Do not hand-edit the generated file.

### `app/src/screens/encounters/EncountersScreen.tsx`

**Purpose** — the sortable, searchable list of an adventure's encounters, and the only place a new encounter is created.

**Behavior** — reads `adventureId` via `useParams({ from: '/adventure/$adventureId/encounters' })`. Fetches with `useEncounters(adventureId)` and `useTableConfigs()`, and locates its config with `tableConfigs.find((c) => c.table_name === 'encounters')`. Row click navigates to `buildEntityPath('encounters', encounter.id, adventureId)`. Create calls `createEncounter()` and navigates to `buildEntityPath('encounters', newEncounterId, adventureId)`. Two separate guards, in this order: while `encountersLoading || configsLoading`, return the loading wrapper; after that, `if (!encountersTableConfig) throw tableConfigNotFoundError('encounters');`. The missing-config case is an error, never folded into the loading guard.

**UI / Visual** — the loading wrapper is `<div className='content-center'><LoadingIcon /></div>`. The loaded state renders `SortableList<Encounter>` with `tableConfigId={encountersTableConfig.id}`, `items={encounters}`, `onRowClick`, `onCreateNew`, and `searchPlaceholder='e.g. "name, some text in description"'` — the placeholder names only the two searchable columns the table config declares, since there is no `summary` column to search.

Otherwise pure substitution from `app/src/screens/foes/FoesScreen.tsx`: `useFoes` → `useEncounters`, `foes` → `encounters`, `foesLoading` → `encountersLoading`, `createFoe` → `createEncounter`, `handleFoeCreation` → `handleEncounterCreation`, `newFoeId` → `newEncounterId`, `foesTableConfig` → `encountersTableConfig`, `Foe` → `Encounter` (from `@db/encounter`), `'foes'` → `'encounters'`, and the `import './FoesScreen.css';` line dropped entirely.

### `app/src/screens/encounter/EncounterScreen.tsx`

**Purpose** — the encounter detail view. Intentionally minimal: a name header above a two-column body of sidebar plus description editor, serving as the base an encounter-specific screen will later be built on.

**Behavior** — reads `adventureId` and `encounterId` via `useParams({ from: '/adventure/$adventureId/encounter/$encounterId' })` and calls `useEncounter(encounterId, adventureId)` for `encounter`, `updateEncounter`, and `loading`. A single guard `if (loading || !encounter)` returns the loading wrapper; the `!encounter` half is required because `encounter.id` is read below. The description editor's `onChange` calls `updateEncounter({ description })`, which the hook debounces. No other state is owned here — `EncounterHeader` and `EncounterSidebar` each call `useParams` and `useEncounter` themselves rather than receiving props, per `app/src/CLAUDE.md`'s framework-context-is-not-a-prop rule.

**UI / Visual** — `GlassPanel className='encounter-screen'`, carrying ``style={{ '--encounter-screen-sidebar-width': `${PREVIEW_WIDTH}px` } as React.CSSProperties}`` with `PREVIEW_WIDTH` imported from `'../screens.constants'`; the custom property feeds the panel's `max-width` calculation. Its children are `<EncounterHeader />` followed by `<div className='encounter-body'>`, which holds `<EncounterSidebar />` and then the description `TextEditor`. `GlassPanel`, `LoadingIcon`, and `TextEditor` come from `@/components`; `EncounterHeader` and `EncounterSidebar` come from `'./components'`, the sub-component barrel this sub-feature creates. The editor takes `value={encounter.description ?? ''}`, ``textEditorId={`ENCOUNTER_${encounter.id}_description`}``, and the `onChange` above; it carries no `placeholder`, matching the description editors on every other detail screen. The loading wrapper is `<div className='content-center'><LoadingIcon /></div>`.

### `app/src/screens/encounter/EncounterScreen.css`

Substitution from `app/src/screens/session/SessionScreen.css`, which is the layout this screen is modeled on. Substitution table:

| SessionScreen.css | EncounterScreen.css |
| --- | --- |
| `.session-screen` | `.encounter-screen` |
| `.session-body` | `.encounter-body` |
| `var(--sidebar-inner-width)` inside the `max-width` calculation | `var(--encounter-screen-sidebar-width)` |

The custom property is renamed because `app/src/CLAUDE.md` — Styles requires a JS-set static custom property to be prefixed with the kebab-cased component name; `SessionScreen`'s unprefixed `--sidebar-inner-width` predates that rule and is not copied. The rename must be applied on both sides: the `style` prop in `EncounterScreen.tsx` sets the same name this file reads. Every other declaration — the flex column, the spacing tokens, `height: 100%`, `justify-self: center`, the full `max-width: calc(...)` expression, and the body grid's `grid-template-columns: auto 1fr` with `min-height: 0` — is copied unchanged.

### `app/src/screens/encounter/components/EncounterHeader.tsx`

**Purpose** — the encounter's name field, mirroring `SessionHeader`'s role at the top of the detail screen.

**Behavior** — reads its own params via `useParams({ from: '/adventure/$adventureId/encounter/$encounterId' })` and calls `useEncounter` for `encounter` and `updateEncounter`. Guards with `if (!encounter) return;` — a bare `return`, never `return null`, since the component's early exit is in a `void`-shaped position. `onCommit` calls `updateEncounter({ name })`.

**UI / Visual** — returns a single `<ScreensNameInput placeholder='Encounter Name' initValue={encounter.name ?? ''} onCommit={...} />`, imported from `'../../components'`, with no wrapping element. `ScreensNameInput` already supplies the `SyncedInput` wiring, the `useFocusNameInputOnArrival` autofocus that makes a freshly duplicated encounter land with its name field focused, and the `screens-name-input` typography class — so this component owns no styles and gets no `.css` file. It exists as its own component solely to hold the `useParams` plus `useEncounter` wiring, which `app/src/CLAUDE.md`'s framework-context-is-not-a-prop rule keeps out of `EncounterScreen`.

Two divergences from `SessionHeader`, which is otherwise the shape reference. First, `SessionHeader` hand-rolls `SyncedInput` plus its own `session-name-input` class and predates the shared `ScreensNameInput`; do not copy that shape. Second, `SessionHeader` wraps its fields in a bare `<header>` element, which new code must not do: `src/components/Header/Header.tsx` is a PascalCase component whose root node is `<header {...props}>` typed `HtmlProps<'header'>`, so it is a name-match under `app/src/CLAUDE.md`'s UI-primitive-wrapper rule — and it is the app's global chrome (breadcrumbs, settings, forward/back nav, updater), which no screen can nest inside itself. Emitting no wrapper element at all is what avoids both horns; the header region needs no element of its own, since it renders one child and declares no layout.

### `app/src/screens/encounter/components/EncounterSidebar.tsx`

**Purpose** — the detail screen's action column. It holds exactly two controls: duplicate and delete.

**Behavior** — reads its own params via `useParams({ from: '/adventure/$adventureId/encounter/$encounterId' })`, calls `useEncounter` for `encounter` and `deleteEncounter`, `useDeleteDialog` from `@/providers` for `openDeleteDialog`, and `useRouter` for navigation. Guards with `if (!encounter) return;`. A local `handleEncounterDelete` awaits `deleteEncounter()` then calls ``void router.navigate({ to: `/adventure/${adventureId}/encounters` })``. The delete button opens the confirm dialog with `{ name: encounter.name ?? '', onDeletionConfirm: () => { void handleEncounterDelete(); }, oneClickConfirm: false }`.

**UI / Visual** — `ScreensSidebar` (imported from `'../../components'`) with `className='encounter-sidebar'` and ``style={{ '--encounter-sidebar-width': `${PREVIEW_WIDTH}px` } as CSSProperties}``, `PREVIEW_WIDTH` from `'../../screens.constants'` and `CSSProperties` from `'react'`. Children, in order: `<ScreensDuplicateBtn entityType='encounters' />`, then a danger `Button` with `label='Delete Encounter'` and `buttonStyle={'danger'}`. There is no `UploadImgBtn` — Encounter has no image column. `StepsNavSidebar` is the shape reference for the width-carrying `ScreensSidebar` usage; `FoeSidebar` is the shape reference for the delete-dialog wiring.

`entityType='encounters'` is the type error that makes SF6 a Foundation SF: `ScreensDuplicateBtn`'s prop is typed `EntityType`, and SF6 is what adds `'encounters'` to that union.

### `app/src/screens/encounter/components/EncounterSidebar.css`

One rule: `.encounter-sidebar { width: var(--encounter-sidebar-width); }`, mirroring `StepsNavSidebar.css`.

### `app/src/screens/encounter/components/index.ts`

Grouping barrel with explicit named exports for the two flat sub-components: `export { EncounterHeader } from './EncounterHeader';` and `export { EncounterSidebar } from './EncounterSidebar';`. Neither sub-component gets its own directory or nested barrel — `app/src/CLAUDE.md` requires one only when a sub-component grows its own `helper/` or `components/` subdirectory, and neither does.

### `app/src/screens/index.ts`

Add two explicit named exports directly after the existing `export { SessionScreen } from './session/SessionScreen';` line, keeping the list order aligned with the sidebar navigation order SF6 establishes:

```ts
export { EncountersScreen } from './encounters/EncountersScreen';
export { EncounterScreen } from './encounter/EncounterScreen';
```

## Tests

None. `app/src/CLAUDE.md` — Testing Policy forbids unit tests for React components, and this sub-feature adds no helper or util functions.

## `domain-scaffold.md` corrections in this sub-feature

Apply these edits to `app/docs/_product/domain-scaffold.md` as part of SF5:

- **`routeTree.gen.ts` instructions** — both the "Implementation Notes" bullet and the trailing paragraph of the Routes section instruct the implementer to hand-add route entries so `tsc` passes. Replace both with: run `npm run build:frontend` once after creating the route files; the `tanstackRouter` plugin registered in `vite.config.ts` regenerates `src/routeTree.gen.ts` from the route files during the build, and the file stays gitignored and uncommitted.
- **"Frontend — Detail Screen" section** — the prescribed structure (a `GlassPanel` with a hand-rolled `CustomScrollArea`, a `[Singular]Header` owning a `GlassPanel intensity='bright'` summary panel, a bare `<aside className='[singular]-sidebar'>`, and a raw `Input` for the name) no longer matches any existing detail screen. Rewrite it around the shared components in `screens/components/`: `ScreensTextEditorLayout` (sidebar / header / body slots), `ScreensSummary`, `ScreensNameInput` (which already wraps `SyncedInput` and the `useFocusNameInputOnArrival` autofocus), and `ScreensSidebar`. Name `screens/foe/` as the reference implementation and note that `screens/session/` is a deliberate exception whose hand-rolled header and layout must not be copied.
- **"Frontend — List Screen" section** — remove the "Companion CSS file: `[Plural]Screen.css` (empty — no domain-specific list layout)" line. `app/src/CLAUDE.md` — Styles forbids creating an empty placeholder `.css` file; a list screen that owns no styles gets no CSS file and no CSS import.
