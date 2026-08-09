# SF6 — Mention popup prefetch

Warm a mention popup's content while the existing hover delay runs, so the popup appears populated rather than filling in after it opens.

## Files affected

- `New:` `app/src/data-access-layer/mentions/mentionPrefetchByType.ts`
- `New:` `app/src/data-access-layer/mentions/usePrefetchMentionEntity.ts`
- `Modified:` `app/src/data-access-layer/mentions/index.ts` — barrel gains `usePrefetchMentionEntity`
- `Modified:` `app/src/data-access-layer/index.ts` — grouping barrel gains `usePrefetchMentionEntity`
- `Modified:` `app/src/components/TextEditor/components/MentionBadge/MentionBadge.tsx` — invoke prefetch on hover

`mentionPrefetchByType` is internal to the mentions module and is exported from neither barrel.

## Data Access Layer

### `mentionPrefetchByType.ts` (new)

A static map from mention entity type to the work required to warm that type's popup. Extracted to its own file as a self-contained supporting definition rather than for consumer count.

```ts
type MentionPrefetch = (
  queryClient: QueryClient,
  entityId: string,
) => Promise<void>;

export const mentionPrefetchByType: Record<string, MentionPrefetch> = {
  npcs: async (queryClient, entityId) => {
    const npc = await queryClient.ensureQueryData(npcQueryOptions(entityId));
    await ensureImagePainted(queryClient, npc.image_id ?? null);
  },
  // …one entry per type below
};
```

Entries required, matching the eight cases `MentionPopupContent` switches on:

| Key | Entity factory | Image |
| --- | --- | --- |
| `npcs` | `npcQueryOptions` | yes |
| `foes` | `foeQueryOptions` | yes |
| `pcs` | `pcQueryOptions` | yes |
| `factions` | `factionQueryOptions` | yes |
| `locations` | `locationQueryOptions` | yes |
| `items` | `itemQueryOptions` | yes |
| `sessions` | `sessionQueryOptions` | no |
| `encounters` | `encounterQueryOptions` | no |

The `sessions` and `encounters` entries resolve their entity and return; those types carry no `image_id` column.

Import each factory from its own module barrel by relative path (`../npcs`, `../foes`, …), never through `@/data-access-layer` — a file inside the data-access-layer grouping folder importing through that folder's own barrel is a circular dependency.

`Record<string, MentionPrefetch>` rather than a key union: `entityType` arrives from `MentionBadge` typed as `string`, sourced from serialized editor node data with no compile-time guarantee, so the lookup must tolerate an unrecognized value. Widening `entityType` to a union is a separate change and is not in scope.

### `usePrefetchMentionEntity.ts` (new)

```ts
type UsePrefetchMentionEntityReturn = {
  prefetchMentionEntity: () => void;
};
```

The hook takes `(entityId: string, entityType: string)` and returns a `void`-returning function. Returning `void` rather than a promise is the contract: this is a speculative warm-up, and a caller must never be able to await it or branch on its outcome.

The returned function looks up `mentionPrefetchByType[entityType]`, returns immediately when the type is unrecognized, and otherwise starts the prefetch with an explicit `.catch()` that swallows the rejection. Swallowing is correct here and must carry an inline comment saying so: the user may never open the popup, the popup's own hooks will surface any real failure to the Error Boundary when it does open, and a speculative fetch must never take down a hover interaction. Without the explicit `.catch()`, a rejected prefetch becomes an unhandled rejection — `void` alone does not handle it.

This is the one place in the data-access layer that deliberately does not use `throwOnError` semantics to reach the Error Boundary, because the fetch is not on behalf of anything currently rendered.

## Frontend

### `MentionBadge.tsx`

**Purpose** — Renders an inline entity reference inside a Lexical editor, opens a hover popup after a delay, and navigates to the entity on click. Unchanged by this sub-feature except for warming the popup's data.

**Behavior** — Call `usePrefetchMentionEntity(entityId, entityType)` at the top level alongside the existing hook calls. In `handleBadgeMouseEnter`, invoke `prefetchMentionEntity()` after the existing `if (hasPopup(entityId)) return;` guard and before `setTimeout(showPopupFromBadge, 500)` is registered.

Placement relative to the guard matters: when a popup for this badge is already open its data is already resolved, so prefetching would be redundant work on every re-entry. Placement relative to the timer matters for the opposite reason — the fetch and the 500 ms delay must run concurrently, which is the entire point. Starting the fetch when the timer *fires* would put the wait back where it is visible.

Add a code comment at the `prefetchMentionEntity()` call site stating that it must run alongside the delay timer rather than inside `showPopupFromBadge`, and that moving it into the timer callback reintroduces the visible popup fill-in. The placement is load-bearing but looks arbitrary, and nothing in the type system or lint configuration would flag the move.

Everything else in the component is unchanged: both timer refs and their cleanup effect, the mouse-tracking refs, `showPopupFromBadge`, `handleClick`, the deleted-entity branch, and the `resolvedName` fallback to `displayName`.

**UI / Visual** — No change. This sub-feature adds no markup, no classes, and no styles.

## Verification

`npx tsc --noEmit`, `npx eslint .`, and `prettier --check .` from `app/`.

`[MANUAL-VERIFY]` Hover a mention badge in any text editor and hold until the popup opens. The popup must appear with its summary and image already present; a popup that opens empty and fills in a beat later means the prefetch is not running concurrently with the delay. This is hover-timing behavior with no automated coverage — the Testing Policy forbids component tests, and no helper or data-layer test can observe whether the fetch overlapped the delay.

`[MANUAL-VERIFY]` Hover a badge whose entity was deleted and confirm the badge still renders its struck-through deleted state and does not throw. The prefetch rejects for a missing entity, and only a live hover exercises whether its `.catch()` absorbs that.
