# SF3 — Row actions menu

Every list row gains an always-visible three-dot trigger at its far right. Clicking it opens a popup containing a single option: Pin when the row is unpinned, Unpin when it is pinned.

The menu is built so that adding further actions later is additive — a new entry in one options array plus its handler — but no action other than Pin/Unpin exists in this sub-feature.

## Files affected

**New:**

- `app/src/components/SortableList/components/SortableListItem/components/RowActionsMenu/RowActionsMenu.tsx`
- `app/src/components/SortableList/components/SortableListItem/components/RowActionsMenu/RowActionsMenu.css`
- `app/src/components/SortableList/helper/isItemPinned.ts`
- `app/src/components/SortableList/helper/__tests__/isItemPinned.test.ts`

**Modified:**

- `app/src/components/SortableList/components/SortableListItem/components/index.ts` — add the new sub-component export.
- `app/src/components/SortableList/helper/index.ts` — add the new helper export.
- `app/src/components/SortableList/components/SortableListItem/SortableListItem.tsx` — render the menu as a sibling of `ActionContainer`; pass the pinned state down; fix the pre-existing `cn()` violation described below.
- `app/src/components/SortableList/components/SortableListItem/SortableListItem.css` — make the row's `GlassPanel` a flex row so the trigger sits outside the column grid.

## Frontend

### `RowActionsMenu`

**Purpose** — the row's action surface. It owns the trigger, the popup's open/closed state, and the pin mutation. It lives in `SortableListItem/components/` because `SortableListItem` is its only consumer today; placement follows the current consumer, not the intent to host more actions later.

**Props**

```ts
type Props = {
  tableConfigId: string;
  itemId: string;
  isPinned: boolean;
};
```

`FCProps<Props>` — the root node renders neither a native element with forwarded attributes nor a specific existing component, so this is props-pattern case 3.

`tableConfigId` is passed rather than the entity type itself: the component resolves the type through `useTableConfig(tableConfigId)` and reads `config.table_name`. That is a framework-managed cached value, and `app/src/CLAUDE.md` requires obtaining such values directly rather than relaying a derived form as a prop. `isPinned` and `itemId` are genuine parent-owned row state and are correctly props.

`config.table_name` is typed `string`, not the `EntityType` union, so no narrowing happens in this component. It is passed through as a string and validated at the service layer via `isEntityType` (SF2). Do not cast it here.

**Behavior**

Local state: `isOpen` (boolean), and a ref to the trigger element used as the popup's anchor. Both are genuine UI state with no synchronous source outside this component.

Clicking the trigger toggles `isOpen`. `AnchoredPopup`'s `onClickOutside` sets it to `false`. Selecting the single option runs the corresponding mutation and then closes the popup.

The mutations come from `useSetPinnedOrder(config.table_name, itemId)` (SF2), which returns `pinItem` and `unpinItem`. Both are async, and the option's `onClick` is a synchronous callback slot, so the call is wrapped: `onClick={() => { void handlePinToggle(); }}` — `@typescript-eslint/no-misused-promises` requires the discarding wrapper, which is one of the permitted wrapper cases in `app/src/CLAUDE.md`.

No try/catch anywhere. Mutation errors reach the Error Boundary.

The trigger's click must not reach the row's navigation handler. Because the trigger is rendered as a sibling of `ActionContainer` rather than inside it, no click passes through the row's button — the DOM structure is what prevents it, not an event-propagation guard. Do not add `stopPropagation` to compensate for a structure that already isolates the click; if a click on the trigger navigates, the structure is wrong.

The popup itself renders through a portal into `document.body`, so clicks inside it are outside the row subtree entirely.

The anchor callback passed to `AnchoredPopup` is `getAnchorRect`, returning the trigger's bounding rect or `null`. Reading `ref.current` inside that callback is safe and does not trip `react-hooks/refs`: the callback is invoked by `AnchoredPopup` during its own render, not during this component's render body.

**UI / Visual**

The trigger is a `ClickableIcon` with `icon={<EllipsisVerticalIcon />}` and `label='Row actions'`. `ClickableIcon` is the established primitive for an icon-only button and already wraps `ActionContainer`, so it supplies the accessible label and focus handling. `EllipsisVerticalIcon` imports directly from `lucide-react` with no `as` alias — that package exports every icon pre-suffixed with `Icon`, so the project's icon-naming rule is satisfied by the direct import.

The trigger is always rendered, never gated on hover or focus.

When open, the structure is `AnchoredPopup` → `PopupSurface` → `<ul>` → one `MenuOptionRow` per option. The single option is:

- unpinned row → `Icon={PinIcon}`, `label='Pin'`
- pinned row → `Icon={PinOffIcon}`, `label='Unpin'`

Exactly one is rendered; the two never appear together. `isActive` and `isSelected` are both left unset — neither state applies to a menu with no persistent selection and no keyboard highlight.

Because `MenuOptionRow` already carries the row layout, icon container, hover treatment, and label styling from SF1, `RowActionsMenu.css` owns only what this component renders itself: the trigger's sizing and its alignment within the row. It must not restate any option-row styling.

Define the option set as a single array mapped to `MenuOptionRow` elements rather than hand-writing the one row inline. That is what makes a second action additive later, and it costs nothing now.

### `SortableListItem` changes

**Purpose** — unchanged.

**Behavior** — unchanged, apart from reading the pinned state off the item and handing it to the menu.

`item` is typed `Record<string, unknown>`, so the pinned flag is derived by narrowing. That narrowing is not written inline: SF4 needs the identical test to partition the list, and a predicate duplicated across two files is a missed extraction under root `CLAUDE.md`'s duplicate-expression rule. It is extracted here, at its first consumer, and SF4 consumes the same function.

### `isItemPinned` helper

```ts
isItemPinned(item: Record<string, unknown>): boolean
```

Returns `true` when `item.pinned_order` is a number. `null`, a missing key, and any non-number value all yield `false` — `null` is what SQL returns for an unpinned row, and a missing key is what a caller passing a partial record produces.

It lives in `SortableList/helper/` rather than `SortableListItem/helper/` because its two consumers — `SortableListItem.tsx` and SF4's `partitionPinnedItems.ts` — sit in different subtrees, and `SortableList/` is the smallest module directory containing both. This is the same placement rule that put `buildGridTemplate` there. It does not belong in `/src/util/`: `pinned_order` is a domain-coupled name with consumers in a single module, failing both util conditions.

`SortableListItem.tsx` imports it as `import { isItemPinned } from '../../helper';` and calls it directly where the pinned flag is needed, alongside the existing `const name = typeof item.name === 'string' ? item.name : '';` line.

**UI / Visual** — the row's `GlassPanel` gains a second child. The current structure is `li > GlassPanel > ActionContainer > cells`; it becomes `li > GlassPanel > (ActionContainer > cells) + RowActionsMenu`.

`ActionContainer` renders a `<button>`, and `ClickableIcon` renders an `ActionContainer`, so the trigger cannot be nested inside the row's button — that would be a button inside a button, which is invalid HTML the parser restructures. The sibling placement is required, not stylistic.

In `SortableListItem.css`, `.sortable-list-item--glass-panel` becomes a flex row with the trigger at its end and `.sortable-list-item--content` taking the remaining width. The trigger sits outside the configurable column grid, so it is unaffected by column resizing and by `dragWidths`. Use existing spacing tokens for the trigger's gutter; introduce no new variable in `styles/variables/`.

**Cleanup required in this file** — `SortableListItem.tsx` currently calls `cn('sortable-list-item--content')` with a single static string. `app/src/CLAUDE.md` restricts `cn()` to conditional or computed class names; a lone static string uses `className='sortable-list-item--content'` directly. Fix it in the same edit pass, per the fix-violations-in-files-you-touch rule. The `cn()` call on the sibling `content-section` div is conditional and stays as it is.

### Barrel update

`app/src/components/SortableList/components/SortableListItem/components/index.ts` is a within-module grouping barrel and uses explicit named exports. Add:

```ts
export { RowActionsMenu } from './RowActionsMenu/RowActionsMenu';
```

Exported directly from the file rather than through a per-directory `index.ts`, matching the existing `AvatarCell` entry: a sub-component directory needs its own barrel only once it grows a `helper/` or `components/` subdirectory, and `RowActionsMenu` has neither.

`RowActionsMenu` imports `AnchoredPopup`, `PopupSurface`, `MenuOptionRow`, and `ClickableIcon` through direct relative paths, not through `@/components`. It sits inside `src/components/`, and that barrel exports all four — importing through it from within the folder closes a cycle. `useTableConfig` and `useSetPinnedOrder` come from `@/data-access-layer`, which is a different grouping folder and therefore not circular.

This sub-feature is where SF2's `useSetPinnedOrder` acquires its consumer.

## Tests

`app/src/components/SortableList/helper/__tests__/isItemPinned.test.ts` — required, since the function lives in a `ComponentName/helper/` directory.

- `'returns true for a numeric pinned_order'`
- `'returns false for a null pinned_order'` — the value SQL returns for an unpinned row
- `'returns false when the pinned_order key is absent'` — a distinct input from `null`, and the case a `typeof` check must handle without throwing
- `'returns false for a zero pinned_order'` — guards against an implementation using truthiness instead of `typeof`; `0` is the ordinal the first pinned item in an adventure receives, so a falsy check here would make the first pin invisible

No component tests. `RowActionsMenu` returns JSX, and `app/src/CLAUDE.md` — Testing Policy forbids unit tests for React components.

`[MANUAL-VERIFY]` Click isolation between the trigger and the row. The row's navigation is a native `<button>` default action, and the trigger avoids it structurally rather than through a handler, so no helper or data-layer test can observe whether the isolation holds. Verify by hand on one list screen: clicking the three-dot trigger opens the popup and does not navigate; clicking the Pin or Unpin option applies the change and does not navigate; clicking anywhere else on the row still navigates.
