# Sub-feature 4: Entity screen content sections

On the base entity screen, the GM can add a content section of a chosen type, rename it, switch between sections through a burger nav, reorder them by dragging, and delete the shown one. The summary panel `BaseEntitySummary` becomes `BaseEntityContentSectionPanel`. Commit type: `feat`.

Behavior, by number of sections:

| Sections | Menu bar left | Menu bar title | Menu bar right | Body |
| --- | --- | --- | --- | --- |
| 0 | "+" | read-only "Content Section" | — | none |
| 1 | "+" | name input | trash | shown section's editor |
| more than 1 | burger | name input | trash | shown section's editor; the burger opens the nav as a popup |

## Files affected

- `Modified:`
  - `app/domain/base-entity-content-sections/index.ts` — export the two label accessors
  - `app/src/data-access-layer/base-entity-content-sections/useBaseEntityContentSections.ts` — the create mutation's `onSuccess` returns its invalidation
  - `app/src/data-access-layer/base-entity-content-sections/__tests__/useBaseEntityContentSections.test.ts` — mock `createSection`; add one test. No existing assertion goes stale: none reads `createSection` or `summarySection`
  - `app/src/components/PanelMenuBar/PanelMenuBar.tsx` — `leading` slot
  - `app/src/components/PanelMenuBar/PanelMenuBar.css` — style the `leading` container like the actions container
  - `app/src/components/MenuOptionRow/MenuOptionRow.tsx` — optional `Icon`
  - `app/src/components/AnchoredPopup/AnchoredPopup.tsx` — `onClickOutside` receives the mousedown event; optional `zIndex`
  - `app/src/screens/base-entity/BaseEntityScreen.tsx` — render `BaseEntityContentSectionPanel`, keyed by the entity's id
  - `app/docs/_product/domain-scaffold.md` — rewrite the first paragraph of "Detail Screen Composition"
- `Deleted:` none
- `New:`
  - `app/domain/base-entity-content-sections/contentSectionTypeLabels.ts`
  - `app/domain/base-entity-content-sections/__tests__/contentSectionTypeLabels.test.ts`
  - `app/src/hooks/useListNavigation.ts`
  - `app/src/hooks/__tests__/useListNavigation.test.ts`
  - `app/src/components/ContentSectionNav/ContentSectionNav.tsx`
  - `app/src/components/ContentSectionNav/ContentSectionNav.css`
  - `app/src/components/ContentSectionNavToggle/ContentSectionNavToggle.tsx`
  - `app/src/screens/base-entity/components/BaseEntityContentSectionPanel/index.ts`
  - `app/src/screens/base-entity/components/BaseEntityContentSectionPanel/components/ContentSectionTypeMenu/ContentSectionTypeMenu.tsx`
  - `app/src/screens/base-entity/components/BaseEntityContentSectionPanel/components/ContentSectionTypeMenu/ContentSectionTypeMenu.css`
  - `app/src/screens/base-entity/components/BaseEntityContentSectionPanel/helper/getIdAfterRemoval.ts`
  - `app/src/screens/base-entity/components/BaseEntityContentSectionPanel/helper/__tests__/getIdAfterRemoval.test.ts`
- `Moved:`
  - `mv app/src/screens/base-entity/components/BaseEntitySummary/BaseEntitySummary.tsx app/src/screens/base-entity/components/BaseEntityContentSectionPanel/BaseEntityContentSectionPanel.tsx`, then rewrite it per `BaseEntityContentSectionPanel` below
  - `mv app/src/screens/base-entity/components/BaseEntitySummary/BaseEntitySummary.css app/src/screens/base-entity/components/BaseEntityContentSectionPanel/BaseEntityContentSectionPanel.css`, then rename `.base-entity-summary` → `.base-entity-content-section-panel` and `.base-entity-summary-content` → `.base-entity-content-section-panel-content`, and add the name-input rule below
- `Draft:` none

## Domain

### `app/domain/base-entity-content-sections/contentSectionTypeLabels.ts` — New

Mirrors `app/domain/entities/entityTypeLabels.ts` (a module-private table plus exported accessors):

- module-private `CONTENT_SECTION_TYPE_LABELS: Record<BaseEntityContentSectionType, string>` = `{ text: 'Text', '5e-stat-block': '5e Stat Block' }`
- `export const contentSectionTypeLabel = (type: BaseEntityContentSectionType): string`
- `export const contentSectionLabel = (name: string | null, type: BaseEntityContentSectionType): string` — `name` unless it is `null` or `''`, else `contentSectionTypeLabel(type)`. Write the check as an explicit comparison: `name || …` trips `@typescript-eslint/prefer-nullish-coalescing` from the `stylisticTypeChecked` preset, and `??` alone would keep `''` [spec-writer_1: app/node_modules/.pnpm/@typescript-eslint+eslint-plugin@8.71.0_@typescript-eslint+parser@8.71.0_eslint@10.11.0_694f5ce9f86d10130f7c448aabb61df1/node_modules/@typescript-eslint/eslint-plugin/dist/configs/flat/stylistic-type-checked.js:43 — `'@typescript-eslint/prefer-nullish-coalescing': 'error'`].

`BaseEntityContentSectionType` is imported from `./contentSectionTypes`.

### `app/domain/base-entity-content-sections/index.ts` — Modified

Add `export { contentSectionTypeLabel, contentSectionLabel } from './contentSectionTypeLabels';`, matching the file's explicit named exports. `domain/index.ts` already has `export * from './base-entity-content-sections'`.

### Test — `app/domain/base-entity-content-sections/__tests__/contentSectionTypeLabels.test.ts` — New

- `returns the section's name when it has one` — `contentSectionLabel('Goblin stats', '5e-stat-block')` is `'Goblin stats'`. Catches the type label overriding a name the GM set.
- `falls back to the type label for an empty name` — `contentSectionLabel('', 'text')` is `'Text'`. Catches a `??`-only fallback that would leave a cleared section blank in the nav.
- `falls back to the type label for a missing name` — `contentSectionLabel(null, '5e-stat-block')` is `'5e Stat Block'`. Catches `null` not falling back.

## Data Access Layer

### `useBaseEntityContentSections.ts` — Modified

- `createMutation`'s `onSuccess` returns the invalidation instead of voiding it: `onSuccess: () => queryClient.invalidateQueries({ queryKey: baseEntityContentSectionKeys.list(baseEntityId) })` (Key Architectural Decisions — Creating a section waits for the refetched list, then selects the new id). `deleteMutation`'s `onSuccess` and `bulkReorderMutation`'s `onError` keep their `void` invalidations: no caller waits on them. Comment on that line: `// Returned rather than voided: a caller selects the id createSection resolves with right away, so the refetched list must already hold that section.`
- Unchanged: the hook's return type, including `summarySection`, which `BaseEntityPopupContent` still reads until Sub-feature 5 removes it.

### `__tests__/useBaseEntityContentSections.test.ts` — Modified

- Add `const createSection = vi.hoisted(() => vi.fn<typeof service.createSection>());` and `createSection` to the `vi.mock('@services/baseEntityContentSectionService', …)` factory, following the existing `updateSection` spy.
- New test `createSection resolves only after the section list refetch settles`:
  - render with `renderSections()`
  - `createSection.mockResolvedValue('section-2')`
  - make the next `getSectionsByBaseEntityId` call return a promise the test resolves by hand (`mockImplementationOnce`)
  - inside `act`, call `result.current.createSection('text', 'Text')` and record when it resolves
  - `await settle(0)`
  - assert: it has not resolved yet; `createSection` was called with `('entity-1', 'text', 'Text')`
  - resolve the refetch with the original row plus `{ ...sectionRow('entity-1'), id: 'section-2', name: 'Text', sort_order: 1 }`, then `await settle(0)`
  - assert: it has resolved; `result.current.sections.map((section) => section.id)` equals `['section-1', 'section-2']`
  - Catches an `onSuccess` that voids its invalidation. `createSection` would then resolve while the list still lacked the new row, and the panel would show the top section before the new one.

## Frontend

### `useListNavigation` — `app/src/hooks/useListNavigation.ts` — New

Generic hook for a list where one item is shown at a time and a nav lets the user choose it (Key Architectural Decisions — Each view owns its shown section and nav state through one generic hook). It sits in `src/hooks/` because a screen component and a `src/components/` component use it. Only frontend components import it.

- `export const useListNavigation = <T extends { id: string }>(items: T[]): ListNavigation<T>`, where the file-local `type ListNavigation<T>` is:
  - `selected: T | null`
  - `isNavAvailable: boolean`
  - `isNavVisible: boolean`
  - `select: (id: string) => void`
  - `toggleNav: () => void`
  - `closeNav: () => void`
- State: `selectedId` (`useState<string | null>(null)`) and `isNavOpen` (`useState(false)`).
- Derived each render:
  - `selected` — the item whose `id` is `selectedId`, else the first item, else `null`
  - `isNavAvailable` — `items.length > 1`
  - `isNavVisible` — `isNavOpen && isNavAvailable`
- `select(id)` stores `id` and closes the nav. `toggleNav()` flips `isNavOpen`. `closeNav()` sets it to `false`.
- Toolchain: `tsconfig.json` has no `noUncheckedIndexedAccess`, so `items[0]` is typed `T`, and `items[0] ?? null` would trip `@typescript-eslint/no-unnecessary-condition`. Use `items.at(0)`, typed `T | undefined` (`.claude/knowledge/typescript.md`; `.claude/knowledge/eslint.md`).
- When the list shrinks to one item, `isNavVisible` turns `false` through `isNavAvailable`; every create and choose path calls `select`, which also closes the nav.

Test — `app/src/hooks/__tests__/useListNavigation.test.ts`. It uses `renderHook`, `act` and `rerender` from `@testing-library/react`, as `app/src/hooks/__tests__/useDraggable.test.ts` does, with items such as `[{ id: 'a' }, { id: 'b' }]`:

- `shows the first item when nothing is selected` — `selected` is `{ id: 'a' }`. Catches an initial `null` selection, which would hide the body on load.
- `shows the selected item` — after `select('b')`, `selected` is `{ id: 'b' }`. Catches `select` not storing the id.
- `falls back to the first item when the selected item leaves the list` — `select('b')`, then rerender with `[{ id: 'a' }]`: `selected` is `{ id: 'a' }`. Catches a stale id producing `null`, which would leave a blank panel after a section is deleted elsewhere.
- `shows a selected item once a later render's list contains it` — with `[{ id: 'a' }]`, `select('b')` leaves `selected` at `{ id: 'a' }`; rerender with `[{ id: 'a' }, { id: 'b' }]` and `selected` is `{ id: 'b' }`. Catches a selection discarded because its id was absent when chosen.
- `returns null for an empty list` — `selected` is `null` (`toBeNull`). Catches `undefined` leaking out.
- `offers navigation only with more than one item` — `isNavAvailable` is `false` for `[{ id: 'a' }]` and `true` for two items. Catches an off-by-one that would show the burger with a single section.
- `shows the nav only while it is open and available` — with two items, `toggleNav()` makes `isNavVisible` `true`; rerender with one item and it is `false`. Catches a nav left visible with one section.
- `closes the nav on a second toggle` — with two items, `toggleNav()` twice leaves `isNavVisible` `false`. Catches a toggle that only opens.
- `closes the nav on closeNav and leaves it closed when called again` — `toggleNav()`, then `closeNav()` twice: `isNavVisible` is `false` after each call. Catches a `closeNav` that toggles, which would reopen the nav on a second outside click.
- `closes the nav when an item is selected` — `toggleNav()`, then `select('b')`: `isNavVisible` is `false`. Catches the nav staying over the body after a choice.

### `PanelMenuBar.tsx` — Modified

- **Purpose:** unchanged — the menu bar of a glass panel, shared by the entity screen panel and the mention popup header.
- **UI / Visual:** a new container left of the title, styled like the actions container (below); empty when no `leading` is given.
- **Behavior:** add `leading?: ReactNode` to `Props`. Render `<div className='panel-menu-bar-leading'>{leading}</div>` before the title `div`, always, as the actions `div` is always rendered.
- Comment, as a `{/* … */}` line directly above that `div`: `Outside the title div, so a control here never receives titleProps — the drag handlers a pinned MentionPopup puts there.`

### `PanelMenuBar.css` — Modified

Add `.panel-menu-bar-leading` to the selector of the `.panel-menu-bar-actions` rule (`display: flex`). Add `.panel-menu-bar-leading > *` to the selector of the `.panel-menu-bar-actions > *` rule (the padding), so both containers' children get the same padding.

### `MenuOptionRow.tsx` — Modified

- **Purpose:** unchanged — one row of a popup menu.
- **UI / Visual:** without `Icon`, the row is its label alone; with one, unchanged.
- **Behavior:** `Icon: LucideIcon` → `Icon?: LucideIcon`. Render the `menu-option-row-icon` `GlassPanel` only when `Icon` is set. `RowActionsMenu`, `TableHandleMenu` and `SlashCommandOptionList` all pass one, so they are unchanged.

### `AnchoredPopup.tsx` — Modified

- **Purpose:** unchanged — a popup portaled to `document.body` and anchored to a rect.
- **Behavior:** the `onClickOutside` prop's type becomes `(event: MouseEvent) => void` and the handler passes the mousedown event on, so the nav can ignore the burger's own mousedown; existing callers pass `() => …` and need no change. A new `zIndex?: number | null` prop becomes the popup's inline `zIndex` (`zIndex ?? undefined`), for a popup opened from a pinned `MentionPopup`, whose inline z-index counts up from the `--most-front` the stylesheet gives.
- **UI / Visual:** unchanged without `zIndex`.

### `ContentSectionNav` — `app/src/components/ContentSectionNav/ContentSectionNav.tsx` (+ `.css`) — New

- **Purpose:** a base entity's content sections as a `ReorderableNavList` inside an `AnchoredPopup` anchored to the burger, shared by the entity screen panel and the mention popup.
- **Props** (case 3, `FCProps<Props>`):
  - `baseEntityId: string`
  - `activeId: string | null`
  - `anchorRef: RefObject<HTMLButtonElement | null>` — the burger the popup anchors to
  - `popupZIndex: number | null` — the z-index the popup takes, `null` for the default
  - `onSelect: (id: string) => void`
  - `onClose: () => void`
  - `newItem: React.ComponentProps<typeof ReorderableNavList>['newItem']`
  - `newItemRef: React.ComponentProps<typeof ReorderableNavList>['newItemRef']`
- **Behavior:** calls `useBaseEntityContentSections(baseEntityId)` for `sections` and `bulkReorder` (Key Architectural Decisions — `ContentSectionNav` and `ContentSectionNavToggle`). It passes the following to `ReorderableNavList`, along with `activeId`, `onSelect`, `onReorder={bulkReorder}`, `newItem` and `newItemRef`:
  - `items={sections.map((section) => ({ id: section.id, label: contentSectionLabel(section.name, section.type), isChecked: false }))}`
- **UI / Visual:** root `<AnchoredPopup getAnchorRect={…} zIndex={popupZIndex} onClickOutside={…}>` wrapping `<PopupSurface className='content-section-nav'>` and the list. `getAnchorRect` returns `anchorRef.current?.getBoundingClientRect() ?? null`; `onClickOutside` returns when the mousedown target is inside `anchorRef.current` (the burger's click toggles the nav) and otherwise calls `onClose`, with a `//` comment saying so. Stylesheet: `.content-section-nav { max-height: var(--summary-content-height); overflow-y: auto; padding: var(--spacing-sm); }`. The folder holds only the component and its stylesheet, so it has no `index.ts`.
- **Imports:**
  - `../AnchoredPopup`, `../PopupSurface/PopupSurface` and `../ReorderableNavList`, relative because they are in the same direct child of `src/`
  - `useBaseEntityContentSections` from `@/data-access-layer`
  - `contentSectionLabel` from `@domain`

### `ContentSectionNavToggle` — `app/src/components/ContentSectionNavToggle/ContentSectionNavToggle.tsx` — New

- **Purpose:** the burger that opens and closes a content section nav, identical on the screen and in the popup.
- **Props** (case 3): `isOpen: boolean`, `onToggle: () => void`, `ref: Ref<HTMLButtonElement>` — the burger's button, which the nav popup anchors to.
- **Behavior:** clicking calls `onToggle`; `isOpen` shows the icon as active.
- **UI / Visual:** `<ClickableIcon ref={ref} icon={<MenuIcon />} isActive={isOpen} onClick={onToggle} label='Toggle content sections' title='Content sections' />`, with `ClickableIcon` from `../ClickableIcon/ClickableIcon` and `MenuIcon` from `lucide-react` (`.claude/knowledge/lucide-react.md`). There's no stylesheet and no `index.ts`.

### `BaseEntityContentSectionPanel` — Moved, then rewritten

- **Purpose:** the body-header panel of every base entity screen, with one content section shown at a time.
- **Props:** none (zero-props exception, `.claude/rules/src-components.md`). `export const BaseEntityContentSectionPanel = () => { … }`. The old `entityType` prop goes away because nothing in the panel needs it any more.
- **State and data:**
  - `baseEntityId` — from `useParams({ strict: false })`, as today
  - `useBaseEntityContentSections(baseEntityId)` — `sections`, `loading`, `createSection`, `updateSection`, `deleteSection`
  - `useListNavigation(sections)` — `selected`, `isNavAvailable`, `isNavVisible`, `select`, `toggleNav`, `closeNav`
  - `useDeleteDialog()` from `@/providers/DeleteDialogProvider` — `openDeleteDialog`
  - `addButtonRef`, `burgerRef` and `newItemButtonRef` — each `useRef<HTMLButtonElement | null>(null)`
  - `typeMenuAnchor` — `useState<'menu-bar' | 'nav' | null>(null)`
  - Every hook above runs before the `loading` check; while `loading`, return nothing (`return;`), as today.
- **Behavior:**
  - **Menu bar `leading`:**
    - `isNavAvailable` — `<ContentSectionNavToggle ref={burgerRef} isOpen={isNavVisible} onToggle={toggleNav} />`
    - otherwise — a `ClickableIcon` with `ref={addButtonRef}`, `PlusIcon`, `label='Add content section'`, `title='Add section'` and `onClick={() => { setTypeMenuAnchor('menu-bar'); }}`
  - **Menu bar title:**
    - with `selected` — `<SyncedInput key={selected.id} className='base-entity-content-section-panel-name-input' initValue={selected.name ?? ''} placeholder={contentSectionTypeLabel(selected.type)} onCommit={(name) => { updateSection(selected.id, { name }); }} />` (`.claude/rules/src-components.md` — Controlled inputs that drive auto-save mutations). A cleared input saves `''`.
    - without — the text `'Content Section'`
    - Comment, as a `//` line directly above the `SyncedInput` inside the `title` expression: `Keyed by section id, so switching sections resets the input's local value.`
  - **Menu bar actions:** with `selected`, a `ClickableIcon` with `Trash2Icon`, `variant='danger'`, `label='Delete section'`, `title='Delete section'` and `onClick={() => { handleDelete(selected); }}`.
  - **`handleDelete(section: BaseEntityContentSection)`** (type from `@db/base-entity-content-section`) calls `openDeleteDialog` with:
    - `name` — `` `Section: ${contentSectionLabel(section.name, section.type)}` ``
    - `oneClickConfirm: true`, as `StepSectionHeader` does
    - `onDeletionConfirm` — computes `getIdAfterRemoval(sections.map((s) => s.id), section.id)`, calls `select` with it when it is not `null`, then calls `void deleteSection(section.id)` (Key Architectural Decisions — Deleting the shown section selects its neighbour first)
  - **Body:**
    - with `selected` — the existing `PanelBody` / `base-entity-content-section-panel-content` wrapper around a `TextEditor` with ``textEditorId={`content-section-${selected.id}`}``, `value={selected.content ?? ''}`, `placeholder='Start typing or use / for commands'` and `onChange={(content) => { updateSection(selected.id, { content }); }}`. Comment, as a `{/* … */}` line directly above that `TextEditor` (the form `TextEditor.tsx` uses above its own keyed element): `Includes the section id, so switching sections remounts TextEditor (it keys on textEditorId) instead of keeping the previous section's content.`
    - `isNavVisible` — `<ContentSectionNav baseEntityId={baseEntityId} activeId={selected?.id ?? null} anchorRef={burgerRef} popupZIndex={null} onSelect={select} onClose={…} newItem={{ label: 'Add section', onClick: () => { setTypeMenuAnchor('nav'); } }} newItemRef={newItemButtonRef} />` rendered after the editor, so the editor stays visible. `onClose` calls `closeNav()` only while `typeMenuAnchor` is `null`, with a `//` comment saying the type picker anchors to a button inside the popup, so a click in the picker must not close the popup under it.
  - **Type menu:** while `typeMenuAnchor` is not `null`, render `<ContentSectionTypeMenu>` with:
    - `getAnchorRect={() => (typeMenuAnchor === 'nav' ? newItemButtonRef : addButtonRef).current?.getBoundingClientRect() ?? null}` — the callback form `RowActionsMenu` uses, so no ref is read during the panel's render
    - `onSelect={(type) => { void handleCreate(type); }}`
    - `onClose={() => { setTypeMenuAnchor(null); }}`
  - **`handleCreate(type: BaseEntityContentSectionType)`** is `async`:
    - `setTypeMenuAnchor(null)`
    - `const id = await createSection(type, contentSectionTypeLabel(type))` (Key Architectural Decisions — A new section is named after its type by its caller)
    - `select(id)`, which also closes the nav
    - No `try`/`catch` (`.claude/rules/src-data-access-layer.md` — Non-negotiable rules)
- **UI / Visual:**
  - Root `GlassPanel intensity='bright' className='base-entity-content-section-panel'` with `PanelMenuBar` inside, as today.
  - Stylesheet (moved): add `.base-entity-content-section-panel-name-input { font-size: inherit; font-weight: inherit; }`, so the input takes `.panel-menu-bar-title`'s font instead of `.input`'s `font-size: var(--font-size-base)`. Import the stylesheet after the `SyncedInput` import, as `app/src/screens/components/ScreensNameInput/ScreensNameInput.tsx` does, so this rule follows `.input`'s in the cascade.
- **Imports:**
  - `useRef` and `useState` from `react`; `useParams` from `@tanstack/react-router`
  - `useBaseEntityContentSections` from `@/data-access-layer`; `useDeleteDialog` from `@/providers/DeleteDialogProvider`; the `BaseEntityContentSection` type from `@db/base-entity-content-section`
  - `@/components/…` for `GlassPanel`, `PanelMenuBar`, `PanelBody`, `ClickableIcon`, `SyncedInput`, `TextEditor`, `ContentSectionNav` and `ContentSectionNavToggle`
  - `@/hooks/useListNavigation`
  - `PlusIcon` and `Trash2Icon` from `lucide-react`
  - `contentSectionTypeLabel`, `contentSectionLabel` and the `BaseEntityContentSectionType` type from `@domain`
  - `./components/ContentSectionTypeMenu/ContentSectionTypeMenu`
  - `./helper/getIdAfterRemoval`

### `ContentSectionTypeMenu` — `…/BaseEntityContentSectionPanel/components/ContentSectionTypeMenu/ContentSectionTypeMenu.tsx` (+ `.css`) — New

- **Purpose:** the popup listing the content section types to create, following `RowActionsMenu` (`app/src/components/SortableList/components/SortableListItem/components/RowActionsMenu/RowActionsMenu.tsx`), which also renders an `AnchoredPopup` around a `PopupSurface` holding a `<ul>` of `MenuOptionRow`s. Here the trigger lives in the parent, because two triggers open it.
- **Props** (case 3):
  - `getAnchorRect: () => DOMRect | null`
  - `onSelect: (type: BaseEntityContentSectionType) => void`
  - `onClose: () => void`
- **Behavior:** choosing an option calls `onSelect(type)`; a mousedown outside calls `onClose`.
- **UI / Visual:** `<AnchoredPopup getAnchorRect={getAnchorRect} onClickOutside={onClose}>` wraps `<PopupSurface className='content-section-type-menu'>` and a `<ul>`. Inside, one `<li key={type}>` per `BASE_ENTITY_CONTENT_SECTION_TYPES` entry holds a `MenuOptionRow` with `label={contentSectionTypeLabel(type)}`, no `Icon`, and `onClick={() => { onSelect(type); }}`. The `<ul>`'s children are `<li>` elements, as its content model requires (`.claude/knowledge/html.md`). Stylesheet: `.content-section-type-menu > * { list-style: none; }`, the same reset `RowActionsMenu.css` applies to its own popup. It stays a separate copy on purpose: a stylesheet cannot import another, and `PopupSurface` also wraps content that is not a list, so the reset does not belong in it.
- **Imports:** `@/components/AnchoredPopup`, `@/components/PopupSurface/PopupSurface`, `@/components/MenuOptionRow/MenuOptionRow`, and `@domain` for the types array, the label and the type.

### `getIdAfterRemoval` — `…/BaseEntityContentSectionPanel/helper/getIdAfterRemoval.ts` — New

- `export const getIdAfterRemoval = (ids: string[], removedId: string): string | null`:
  - `null` when `removedId` is not in `ids`
  - else the id directly after it, when there is one
  - else the id directly before it, when there is one
  - else `null`
- Toolchain:
  - `ids.at(index - 1)` wraps to the last id when `index` is `0`, so the "before" branch has to check `index > 0`.
  - `ids[index + 1]` is typed `string` (no `noUncheckedIndexedAccess`), so test past-the-end with `.at()` or a length comparison, never with `?? …`, which trips `no-unnecessary-condition`.

Test — `helper/__tests__/getIdAfterRemoval.test.ts`, with `ids = ['a', 'b', 'c', 'd', 'e']`:

- `returns the id directly below a removed middle id` — `getIdAfterRemoval(ids, 'c')` is `'d'`. Catches choosing the previous section when a next one exists.
- `returns the id directly above a removed last id` — `getIdAfterRemoval(ids, 'e')` is `'d'`. Catches `null` (or `undefined`) at the end of the list.
- `returns null when the only id is removed` — `getIdAfterRemoval(['a'], 'a')` is `null`. Catches `.at(-1)` wrapping around to the removed id itself.
- `returns null for an id not in the list` — `getIdAfterRemoval(ids, 'x')` is `null`. Catches `indexOf`'s `-1` turning into `ids[0]`.

### `index.ts` — `…/BaseEntityContentSectionPanel/index.ts` — New

`export { BaseEntityContentSectionPanel } from './BaseEntityContentSectionPanel';` is an explicit named export. The folder has `components/` and `helper/`, so it gets an `index.ts` (`app/src/CLAUDE.md` — Barrel Files), and nothing from `components/` or `helper/` is re-exported.

### `BaseEntityScreen.tsx` — Modified

- **Purpose:** unchanged — the base entity screen.
- **UI / Visual:** unchanged layout; the body-header slot holds the new panel.
- **Behavior:**
- `import { BaseEntitySummary } from './components/BaseEntitySummary/BaseEntitySummary';` → `import { BaseEntityContentSectionPanel } from './components/BaseEntityContentSectionPanel';`
- `bodyHeader={<BaseEntitySummary entityType={entityType} />}` → `bodyHeader={<BaseEntityContentSectionPanel key={baseEntity.id} />}`. Comment, as a `//` line directly above the element inside the `bodyHeader` expression: `Keyed by entity id, so the shown section and an open nav reset when the router reuses this screen for another entity.` (TanStack Router reuses the screen component across param changes [architect_11: app/src/components/TextEditor/TextEditor.tsx:134].)

## Docs

### `app/docs/_product/domain-scaffold.md` — Modified

Replace the first paragraph under "Detail Screen Composition" with this single line. The current paragraph still names `ScreensSummary`, which no longer exists, and `summarySection`.

> `screens/base-entity/BaseEntityScreen.tsx` composes `ScreensTextEditorLayout`: the header slot renders `ScreensNameInput` for the entity's name, the sidebar slot renders `<BaseEntitySidebar entityType={entityType} />`, the body-header slot renders `BaseEntityContentSectionPanel` keyed by the entity's id — the entity's content sections, one shown at a time, with a menu bar to add, rename, switch between and delete them — and the body slot renders the description editor. This is the reference implementation for that composition pattern.

## Verification

Run the every-check rows from `app/`: `npx tsc --noEmit`, `npx eslint .`, `npx prettier --check .`.

Human-tester hand-off (`pnpm run dev` only):

- **0 sections:** an entity shows "Content Section" with a "+". Choosing "5e Stat Block" creates and shows a section named "5e Stat Block", and the "+" stays.
- **Second section:** adding a second section shows it, and the "+" becomes a burger.
- **Burger nav:** the burger opens the nav as a popup next to it while the editor stays visible, with the current section in the foreground colour. A click outside the popup, or on the burger again, closes it. Dragging by ⠿ reorders, and after a reload the top section is shown. Clicking an item shows it. "Add section" in the nav opens the type picker next to that button.
- **Rename:** clearing a name leaves the input empty with the type as placeholder, while the nav shows the type label.
- **Delete:** deleting the third of five shows the old fourth, deleting the last shows the one above it, and deleting down to one turns the burger back into "+".
- **Switching entities:** going to another entity resets to its top section.
