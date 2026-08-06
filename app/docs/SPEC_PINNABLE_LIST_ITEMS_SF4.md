# SF4 — Pinned section

Pinned rows collect under a "Pinned" heading above the regular list. While a search term is active, no partitioning happens and the list behaves exactly as it does today.

## Files affected

**New:**

- `app/src/components/SortableList/helper/partitionPinnedItems.ts`
- `app/src/components/SortableList/helper/__tests__/partitionPinnedItems.test.ts`

**Modified:**

- `app/src/components/SortableList/helper/index.ts` — add the new helper export.
- `app/src/components/SortableList/SortableList.tsx` — partition the sorted results and render the pinned group.
- `app/src/components/SortableList/SortableList.css` — add the heading rule; rename the four BEM-violating class names described below.

## Frontend

### `partitionPinnedItems` helper

Lives in `SortableList/helper/` rather than `/src/util/`: it is coupled to this component's domain (pinned list rows) and has one consumer, which fails both conditions for util placement.

```ts
partitionPinnedItems<T extends Record<string, unknown>>(items: T[]): { pinnedItems: T[]; unpinnedItems: T[] }
```

Splits using `isItemPinned` from the same `helper/` directory — introduced in SF3 and imported here as `import { isItemPinned } from './isItemPinned';`, a direct sibling path rather than through the `helper/` barrel it is itself part of. Do not re-inline the `typeof` check: this and `SortableListItem.tsx` are the two call sites the extraction exists for.

`pinnedItems` is returned sorted ascending by `pinned_order`. `unpinnedItems` preserves the input order, because the caller has already sorted it.

The generic constraint matches `SortableList`'s own (`T extends Record<string, unknown> & { id: string }` narrows to this), so the helper stays usable without the id constraint it does not need.

### `SortableList` changes

**Purpose** — unchanged.

**Behavior**

The existing pipeline is untouched: `useListFilter` runs on the full `items` array, and both result buckets go through `useSortable` exactly as they do now. Partitioning applies afterwards, and only to `sortedNameMatches`, and only when `isSearching` is false.

This ordering is what makes the search path a no-op. When the search term is empty, `useListFilter` returns every item as `nameMatches` with an empty `fieldMatches`, so partitioning the sorted name matches partitions the whole list. When a term is present, the partition is skipped entirely and pinned rows flow through the normal filter and ranking alongside everything else.

No hook call is added, moved, or made conditional. The partition is a plain call in render, derived from values already computed — it needs no `useMemo`, since nothing reads it from an effect dependency array and no child is memoized.

Placement: the call reads both `sortedNameMatches` and `isSearching`. `sortedNameMatches` is declared above the `if (!config) return;` early return, but `isSearching` is declared below it, so the partition call belongs after `isSearching` — grouped with the other derived booleans (`hasFieldMatches`, `hasNothingToShow`, `showCreateNewBtn`), not with the hook calls at the top of the component.

The pinned group is not rendered when it is empty, and neither is its heading. The existing empty and no-results states are unchanged: `hasNothingToShow` and the create-new button logic keep reading the same values they read today.

**UI / Visual**

Inside the existing `<ul>`, before the regular rows and after the create-new button, render — only when not searching and at least one row is pinned — an `<li>` carrying the heading text `Pinned`, followed by the pinned rows as `SortableListItem` elements identical in every prop to the regular ones.

The heading is an `<li>` rather than a heading element outside the list, because it sits inside a `<ul>` whose only valid children are list items. It is a visual label, not an interactive row.

No divider is rendered between the pinned group and the regular rows. Separation is carried by the heading alone.

The pinned rows are ordered by `pinned_order` ascending, which is insertion order, and deliberately do not follow the list's active column sort — sorting the regular list by a different column leaves the pinned group untouched.

`SortableList.css` gains one rule for the heading class. Style it as a muted section label consistent with the existing `sortable-list-no-results` treatment; use existing tokens for spacing, size, and colour, and add no new variable to `styles/variables/`.

**Cleanup required in this file** — `SortableList.css` and `SortableList.tsx` currently use four class names carrying the BEM element suffix `__`, which `app/src/CLAUDE.md` — Styles bans outright ("There are no `block__element` class names in this codebase"). Rename all four in the same edit pass, updating both the stylesheet and every `className` in the component:

| Current | Renamed |
| --- | --- |
| `sortable-list__scroll-area` | `sortable-list-scroll-area` |
| `sortable-list__table` | `sortable-list-table` |
| `sortable-list__divider` | `sortable-list-divider` |
| `sortable-list__no-results` | `sortable-list-no-results` |

Confirm with a grep that no other file references any of the four before renaming — they are component-local, but the check is cheap and a missed reference fails silently at runtime rather than at compile time.

The new heading class follows the corrected convention: `sortable-list-pinned-heading`.

### Barrel update

`app/src/components/SortableList/helper/index.ts` is a within-module grouping barrel with explicit named exports. Add:

```ts
export { partitionPinnedItems } from './partitionPinnedItems';
```

`SortableList.tsx` imports it via `./helper`, matching how it already reaches `buildGridTemplate`'s sibling barrel from `SortableListItem`.

## Tests

`app/src/components/SortableList/helper/__tests__/partitionPinnedItems.test.ts` — required: `app/src/CLAUDE.md` — Testing Policy mandates tests for every helper in a `ComponentName/helper/` directory.

- `'returns every item as unpinned when no item has a pinned_order'`
- `'moves items with a numeric pinned_order into pinnedItems'`
- `'orders pinnedItems ascending by pinned_order'` — assert against a fixture whose input order differs from its pinned order, so a passing test cannot be satisfied by input order alone
- `'preserves the input order of unpinnedItems'` — the caller has already sorted them, so re-ordering here would silently override the active column sort

The `null`, missing-key, and zero cases are covered by `isItemPinned`'s own tests (SF3) and are not restated here — this helper delegates that decision rather than reimplementing it.

Assert on ordering relationships and on which bucket each item lands in. No constant from the implementation is involved, so literal expectations are correct here — the geometry-helper rule about importing tuned constants does not apply.
