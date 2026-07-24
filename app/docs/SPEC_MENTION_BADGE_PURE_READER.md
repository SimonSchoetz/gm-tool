# Mention Badge — Pure Reader + Deleted-Mention Popup

- Sub-feature 1: Badge as pure reader — remove the node's `color` snapshot and the render-time re-snapshot effect so the badge never writes the document
- Sub-feature 2: Deleted-mention hover popup — a deleted badge shows a header-less popup reading "Deleted <Label>"
- Sub-feature 3: Popup-content Error Boundary — a live popup whose entity was deleted mid-session shows the deleted fallback instead of crashing the screen

## Key Architectural Decisions

### The mention badge never writes the persisted document as a side effect of rendering

`MentionBadge` resolves its name from `useMentionEntityData` and its color from `useTableConfigs` on every render — both are live sources. The prior implementation additionally wrote those live values back onto the `MentionNode` via a render-time `editor.update()` (the "re-snapshot" effect). That write is an untagged Lexical mutation: it flows through `OnChangePlugin` → the editor's `onChange` → the screen's debounced auto-save mutation → a DB `UPDATE` that bumps `updated_at` and enqueues a `_sync_changes` row. The effect is therefore removed entirely. Rendering is a read; it must not mutate persisted, peer-synced state. Consequence: a Table Config color change or an entity rename produces zero document writes and zero sync traffic for every document that mentions the affected entity.

### `color` is removed from the node; it is resolved live from Table Config at render time

The node's stored `__color` was only ever read as the `?? color` fallback behind the live `tableConfig.color`, and only during the brief `useTableConfigs()` loading window (an entity that no longer resolves renders the deleted state, which uses no color). Storing a display setting that has a single always-available live source is denormalization with a near-dead read path. `__color` and its serialized field are removed from `MentionNode`. `MentionBadge` resolves color from `useTableConfigs()` alone; the loading window is covered by a CSS `var()` fallback to `--color-fg-rgb`, not a stored value.

### No data migration is required for the removed `color` field

`importJSON` reads named fields off the serialized JSON; a field it no longer reads (`color`) is silently ignored on old persisted documents. Removing `color` from `SerializedMentionNode` and from `exportJSON` is backward-compatible — no persisted document needs rewriting. This mirrors the existing optional-field tolerance already used for `adventureId` and `mentionFormats`.

### The deleted-entity fallback shows the insertion-time name

With the re-snapshot effect gone, the node's stored `displayName` remains the name captured at insertion time and is the deleted-entity fallback. Keeping the "last-known name up to deletion" would require writing to the document after insertion — the exact behavior this spec removes. Deleting a mentioned entity is an edge case; showing the name the author used when they wrote the reference is the deliberate, accepted semantic.

### A deleted mention renders a header-less informational popup, not the live popup pipeline

The live popup (`MentionPopupContent` → per-entity body → `useNpc`/`useFoe`/…) fetches entity data through hooks with `throwOnError: true` whose service layer throws a not-found domain error for a missing id — rendering it for a deleted entity would route that error to the Error Boundary and take down the screen. The deleted variant therefore never enters that pipeline: `MentionPopup` branches on a `deleted` flag and renders a static `DeletedMentionContent` body directly. It renders **no header** — navigate, pin, and drag all presuppose a live, actionable entity and are inapplicable to a tombstone. Because there is no header, the popup cannot be pinned, so it auto-dismisses on mouse-leave through the existing `!isPinned → onRemove` path — the desired hover-only behavior with no extra code.

### Live vs. deleted popup — affordance decisions

| Affordance | Live popup | Deleted popup |
| --- | --- | --- |
| Header (name, navigate, pin, drag, close) | rendered | **not rendered** |
| Body | `MentionPopupContent` (live per-entity fetch) | `DeletedMentionContent` (static "Deleted <Label>", no fetch) |
| Dismissal | pin to persist, else mouse-leave | mouse-leave only (never pinnable) |

### The entity-type display label is domain vocabulary

Mapping a plural table name (`npcs`) to a display label (`NPC`) is entity-type vocabulary and lives in `domain/mentions/`, beside `MENTIONABLE_ENTITY_TYPES`. The labels are not derivable by capitalizing the singular — `npcs`/`pcs` are acronyms (`NPC`/`PC`) while others are title-case (`Foe`) — so an explicit map is required. `entityTypeLabel` reuses the existing `isMentionableEntityType` guard to narrow before indexing and returns a generic `'Entity'` fallback for an unrecognized type (a mention whose `entityType` is not in the canonical list is treated as deleted, so this fallback is reachable).

### A popup-content Error Boundary closes the deleted-entity crash window the badge's `deleted` flag cannot

`MentionBadge` renders the header-less deleted popup only when its own `useMentionEntityData` already resolved `deleted: true` (SF2). That flag refreshes only on the badge's own remount (`refetchOnMount: 'always'`, no cross-module invalidation). A badge mounted before its entity is deleted elsewhere — the multi-device case: another device deletes the entity while this document stays open — keeps `deleted: false`, opens the *live* popup, and `MentionPopupContent`'s per-entity body (`NpcPopupContent` → `useNpc`, `throwOnError: true`) fetches on mount, hits a genuinely missing row, and throws `*NotFoundError` during render. Without a scoped boundary that reaches the app-level Error Boundary and crashes the whole screen. A pinned popup left open across a background refetch has the same exposure. `MentionPopupContent` is therefore wrapped in a React error boundary whose fallback is `DeletedMentionContent` — the same "Deleted <Label>" body the known-deleted path shows. This closes the second instance of the crash class that SF2's `deleted` short-circuit only closes for the already-known-deleted path.

### The popup boundary uses `react-error-boundary` directly, not the app-level `ErrorBoundary`

The app-level `ErrorBoundary` (`components/ErrorBoundary`) hardcodes a full-screen "Something went wrong / Go home" fallback and logs via `onError` — correct for the app root, wrong inside a hover popup, and it exposes no fallback prop. The popup boundary is a different concern (localized graceful degradation of a display affordance), so it uses `react-error-boundary`'s own `ErrorBoundary` (v6.1.2, already a direct dependency) with a scoped `fallback` element. Bypassing the app wrapper also avoids logging an expected not-found as an application error. A boundary catches *any* render error in its subtree, not only not-found; showing the deleted fallback for all of them is a deliberate simplification — a deleted entity is the overwhelming real cause on this path. The header sits outside the boundary and keeps showing the last-known name and its now-dead navigate control in this rare race; that is an accepted limitation, not a regression, and the crash — the actual defect — is gone.

## CLAUDE.md Impact

None. No CLAUDE.md file documents `MentionNode`'s fields, the mention popup's sub-component set, or a `domain/mentions` member list, so removing `color` and adding `entityTypeLabel`/`DeletedMentionContent` invalidates no documented example or enumerated class. `entityTypeLabel` is a mention-feature vocabulary helper, not a new domain entity, layer, or ambient system — `app/docs/_product/domain-scaffold.md` is unaffected.

---

## Sub-feature 1: Badge as pure reader

Removes the node's `color` snapshot and the render-time re-snapshot effect. After this SF the badge issues no `editor.update()` and stores no color. SF1 and SF2 are independent and may be committed in either order; SF1 is sequenced first as the core fix.

### Files affected

**Modified:**

- `app/src/components/TextEditor/nodes/MentionNode.tsx` — remove `color` from the serialized type, the class field, the constructor, and every method that reads or forwards it
- `app/src/components/TextEditor/components/MentionBadge/MentionBadge.tsx` — remove the re-snapshot effect, the `color`/`nodeKey` props, and the now-dead editor/lexical imports
- `app/src/components/TextEditor/components/MentionBadge/MentionBadge.css` — add the loading-window color fallback
- `app/src/components/TextEditor/plugins/MentionTypeaheadPlugin/MentionTypeaheadPlugin.tsx` — drop the `color` argument from `new MentionNode(...)`

No barrel changes: no exported symbol name is added or removed.

### Frontend — `MentionNode.tsx`

Remove every occurrence of `color` from the node. Each edit is a mechanical removal:

- `SerializedMentionNode`: delete the `color: string;` member.
- Class body: delete the `__color: string;` field declaration.
- Constructor: delete the `color: string` parameter (the 4th positional parameter, between `displayName` and `adventureId`) and the `this.__color = color;` assignment. The resulting positional signature is `(entityId, entityType, displayName, adventureId?, mentionFormats?, key?)`.
- `convertMentionElement`: change `new MentionNode(entityId, entityType, displayName, '', adventureId)` to `new MentionNode(entityId, entityType, displayName, adventureId)` — the `''` placeholder color argument is removed.
- `static clone`: remove the `node.__color,` argument.
- `static importJSON`: remove the `json.color,` argument. Do not add any migration for the now-unread `color` field on old JSON — `importJSON` ignoring it is the intended backward-compatible path (see KAD "No data migration required").
- `exportJSON`: remove the `color: this.__color,` line.
- Delete the `setColor(color: string): this { ... }` method in full.
- `decorate()`: remove both `color={this.__color}` and `nodeKey={this.getKey()}` from the `<MentionBadge ... />` element. `nodeKey` is removed because SF1 also removes the badge prop that consumed it (below).

### Frontend — `MentionBadge.tsx`

Remove the re-snapshot effect and everything that existed only to serve it.

- `Props`: remove `color: string;` and `nodeKey: NodeKey;`. Remove `color` and `nodeKey` from the destructured parameter list.
- Delete the entire re-snapshot `useEffect` (the effect whose body calls `editor.update()` to run `setDisplayName`/`setColor`, with the guard `if (liveName === displayName && resolvedColor === color) return;`).
- Delete `const [editor] = useLexicalComposerContext();`.
- Remove the now-unused imports: `useLexicalComposerContext`, `$getNodeByKey`, the `NodeKey` type, and the `import type { MentionNode } from '../../nodes';` type import. `noUnusedLocals`/`noUnusedParameters` are active, so any of these left in place fails `tsc`.
- Keep the existing cleanup `useEffect` (the timer-clearing effect) and its `useEffect` import — it is unrelated to the removed effect.

Change the color resolution to drop the stored-color fallback. At the existing `resolvedColor` declaration:

```tsx
const resolvedColor = tableConfig?.color ?? null;
```

`?? null` (not `?? undefined`) is required by the app-wide ban on `undefined` as a domain value; the type becomes `string | null`. In the existing `style` object, `'--rt-mention-badge-color': resolvedColor` is unchanged textually — when `resolvedColor` is `null` (the brief window before `useTableConfigs()` resolves), React omits the custom property, so the CSS `var()` fallback added below applies.

The `deleted`-branch return and the live-badge return markup are otherwise unchanged by this SF.

### Frontend — `MentionBadge.css`

Give the runtime color a fallback for the loading window, so a live badge whose Table Config has not yet resolved renders as normal foreground text rather than un-colored. Change the `.mention-badge` color declaration:

```css
.mention-badge {
  cursor: pointer;
  font-weight: var(--font-weight-medium);
  color: rgb(var(--rt-mention-badge-color, var(--color-fg-rgb)));
  text-decoration: var(--mention-badge-text-decoration, none);
}
```

`--color-fg-rgb` is an existing triplet token (`color-variables.css`), triplet-compatible with the surrounding `rgb(...)`. No new token is added.

### Frontend — `MentionTypeaheadPlugin.tsx`

In `onSelectOption`, drop the color argument from node construction:

```tsx
const mentionNode = new MentionNode(
  option.result.id,
  option.result.tableName,
  option.result.name,
  option.result.adventureId,
);
```

`option.result.color` remains in use elsewhere (the option-list swatch) and is not removed from the search result — only its use as a node constructor argument is removed.

### Test coverage

No test file is added or changed. All four modified files are either a Lexical node class (no established test convention) or React components (Testing Policy forbids component tests). No helper or util function is introduced.

---

## Sub-feature 2: Deleted-mention hover popup

A deleted mention badge gains the live badge's hover interaction; the popup renders only a body reading "Deleted <Label>". No per-entity data is fetched for a deleted mention.

### Files affected

**New:**

- `app/domain/mentions/entityTypeLabels.ts` — `entityTypeLabel(entityType)` and its label map
- `app/domain/mentions/__tests__/entityTypeLabels.test.ts` — tests for `entityTypeLabel`
- `app/src/components/MentionPopup/components/DeletedMentionContent/DeletedMentionContent.tsx` — the deleted-state popup body
- `app/src/components/MentionPopup/components/DeletedMentionContent/DeletedMentionContent.css`

**Modified:**

- `app/domain/mentions/index.ts` — export `entityTypeLabel`
- `app/domain/index.ts` — re-export `entityTypeLabel` through the grouping barrel
- `app/src/providers/PinnedPopupsProvider/PinnedPopupsContext.ts` — add `deleted?: boolean` to `ShowPopupArgs`
- `app/src/providers/PinnedPopupsProvider/PinnedPopupsProvider.tsx` — carry `deleted` through `PopupEntry` and spread it to `MentionPopup`
- `app/src/components/MentionPopup/MentionPopup.tsx` — accept `deleted`, render the header-less deleted body when set
- `app/src/components/MentionPopup/components/index.ts` — export `DeletedMentionContent`
- `app/src/components/TextEditor/components/MentionBadge/MentionBadge.tsx` — attach hover handlers to the deleted `<span>` and pass `deleted` to `showPopup`

### Domain — `entityTypeLabels.ts`

```ts
import { isMentionableEntityType, type MentionableEntityType } from './entityTypes';

const ENTITY_TYPE_LABELS: Record<MentionableEntityType, string> = {
  npcs: 'NPC',
  foes: 'Foe',
  pcs: 'PC',
  factions: 'Faction',
  locations: 'Location',
  items: 'Item',
};

export const entityTypeLabel = (entityType: string): string =>
  isMentionableEntityType(entityType) ? ENTITY_TYPE_LABELS[entityType] : 'Entity';
```

The `isMentionableEntityType` guard narrows `entityType` to `MentionableEntityType`; indexing the fully-keyed `Record` with the narrowed value returns `string` (`noUncheckedIndexedAccess` is off in `app/tsconfig.json`), so no `| undefined` widening and no `no-unnecessary-condition` hit on the ternary.

### Domain — `mentions/index.ts`

Add an explicit named export beside the existing ones:

```ts
export { entityTypeLabel } from './entityTypeLabels';
```

### Domain — `index.ts`

Add `entityTypeLabel` to the existing `./mentions` value re-export block (explicit named exports; this grouping barrel bans `export *`):

```ts
export {
  mentionSearchError,
  mentionEntityTypeError,
  buildEntityPath,
  MENTIONABLE_ENTITY_TYPES,
  isMentionableEntityType,
  entityTypeLabel,
} from './mentions';
```

### Provider — `PinnedPopupsContext.ts`

Add one optional field to `ShowPopupArgs`:

```ts
deleted?: boolean;
```

`ShowPopupArgs` is the caller-facing argument type; `deleted` is optional so live callers need not pass it.

### Provider — `PinnedPopupsProvider.tsx`

- Add `deleted: boolean;` to the internal `PopupEntry` type (required — every stored entry carries a resolved flag).
- In `showPopup`, destructure `deleted` out of the args and default it when building the entry. The bridge-callback destructure already strips the two bridge callbacks; add `deleted` to it:

```ts
const { onMouseEnterBridge, onMouseLeaveBridge, deleted, ...entry } = args;
```

Then in the object pushed into state, add:

```ts
deleted: deleted ?? false,
```

`deleted ?? false` resolves `boolean | undefined` to the required `boolean`, satisfying `exactOptionalPropertyTypes`.

- The render `map` already destructures `pinned`/bridge callbacks into `entrySpread`; `deleted` stays in `entrySpread` and is forwarded to `<MentionPopup {...entrySpread} ... />` with no further change.

### Frontend — `MentionPopup.tsx`

- Add `deleted: boolean;` to `Props` (required — the provider always supplies it) and to the destructured parameters.
- Import `DeletedMentionContent` from the sub-components barrel, extending the existing import:

```ts
import { MentionPopupHeader, MentionPopupContent, DeletedMentionContent } from './components';
```

- Render the body conditionally inside the existing single `GlassPanel`. Keep every `GlassPanel` prop (ref, positioning `style`, `onMouseEnter`/`onMouseLeave`/`onMouseDown`) unchanged; only the children branch:

```tsx
{deleted ? (
  <DeletedMentionContent entityType={entityType} />
) : (
  <>
    <MentionPopupHeader
      name={name}
      isPinned={isPinned}
      draggableProps={draggableProps}
      onPin={handlePin}
      onRemove={onRemove}
      onNavigate={handleNavigate}
    />
    <MentionPopupContent
      entityId={entityId}
      entityType={entityType}
      adventureId={adventureId}
    />
  </>
)}
```

`handleNavigate`, `handlePin`, and `draggableProps` remain referenced in the live branch, so `noUnusedLocals` is satisfied. All hooks (`useState`, `useDraggable`, `useRef`, `useLayoutEffect`, `useNavigate`) stay above the branch and run unconditionally. The deleted branch never mounts `MentionPopupContent`, so no per-entity DAL hook runs for a deleted id — this is the structural guard against the Error-Boundary crash (KAD "A deleted mention renders a header-less informational popup").

### Frontend — `DeletedMentionContent.tsx`

```tsx
import { FCProps } from '@/types';
import { entityTypeLabel } from '@domain';
import './DeletedMentionContent.css';

type Props = {
  entityType: string;
};

export const DeletedMentionContent: FCProps<Props> = ({ entityType }) => (
  <div className='deleted-mention-content'>Deleted {entityTypeLabel(entityType)}</div>
);
```

- **Purpose**: the sole body of the deleted-mention popup; states that the referenced entity no longer exists, labeled by its type.
- **Behavior**: no state, no data hooks, no side effects. Pure render from the single `entityType` prop.
- **UI / Visual**: one muted line, padded to match the live popup body (`entity-popup-body` uses `var(--spacing-sm)`).

### Frontend — `DeletedMentionContent.css`

```css
.deleted-mention-content {
  padding: var(--spacing-sm);
  color: var(--color-text-muted);
}
```

Both tokens exist (`spacing-variables.css`, `color-variables.css`); no new token is added.

### Frontend — `MentionPopup/components/index.ts`

Add the flat sub-component export (no own `index.ts` — `DeletedMentionContent/` has no internal `helper/` or `components/`):

```ts
export { DeletedMentionContent } from './DeletedMentionContent/DeletedMentionContent';
```

### Frontend — `MentionBadge.tsx`

Attach the existing hover machinery to the deleted `<span>` and tell the popup it is a deleted mention. The component-level `badgeRef`, `handleBadgeMouseEnter`, `handleBadgeMouseLeave`, and `showPopupFromBadge` are declared before the deleted branch and are reused as-is — no duplication.

- Add `ref`, `onMouseEnter`, and `onMouseLeave` to the deleted `<span>`:

```tsx
<span
  ref={badgeRef}
  className='mention-badge mention-badge--deleted'
  onMouseEnter={handleBadgeMouseEnter}
  onMouseLeave={handleBadgeMouseLeave}
>
  {displayName}
</span>
```

The deleted span gains no `onClick` — it stays non-navigable, matching the deleted-entity "no longer clickable/linked" behavior; the added handlers provide hover-to-inform only. `cursor: text` in the existing CSS is unchanged.

- In `showPopupFromBadge`, add `deleted` to the `showPopup` argument object (shorthand for the `deleted` value already destructured from `useMentionEntityData`):

```ts
showPopup({
  entityId,
  entityType,
  adventureId,
  name: resolvedName,
  deleted,
  position: { x: rect.left, y },
  placement,
  onMouseEnterBridge: () => { /* unchanged */ },
  onMouseLeaveBridge: () => { /* unchanged */ },
});
```

Live badges pass `deleted: false` (header popup); the deleted badge passes `deleted: true` (header-less body). The `name` passed for a deleted mention is `displayName` (via `resolvedName`) and is unused by the header-less deleted popup — harmless.

### Test coverage

`app/domain/mentions/__tests__/entityTypeLabels.test.ts` — `entityTypeLabel` is a domain function and requires tests. Two paths from the KAD "The entity-type display label is domain vocabulary":

- `entityTypeLabel returns the display label for each known entity type` — assert each mapping exactly: `npcs → 'NPC'`, `foes → 'Foe'`, `pcs → 'PC'`, `factions → 'Faction'`, `locations → 'Location'`, `items → 'Item'` (the `NPC`/`PC` acronym cases must be asserted, since they are why the map cannot be derived by capitalization).
- `entityTypeLabel returns 'Entity' for an unrecognized entity type` — assert `entityTypeLabel('sessions') === 'Entity'` (a real non-mentionable table name).

`DeletedMentionContent.tsx` is a React component — no test (Testing Policy forbids component tests).

---

## Sub-feature 3: Popup-content Error Boundary

Wraps the live popup's content in an error boundary so a mention whose entity is deleted after the badge last resolved shows the deleted fallback instead of crashing the screen. Depends on SF2 — reuses `DeletedMentionContent` and the `deleted ? … : …` branch established in `MentionPopup`.

### Files affected

**Modified:**

- `app/src/components/MentionPopup/MentionPopup.tsx` — wrap `MentionPopupContent` in a `react-error-boundary` boundary with a `DeletedMentionContent` fallback

No new files and no barrel changes: `DeletedMentionContent` is already exported from `MentionPopup/components/index.ts` (SF2), and `ErrorBoundary` is imported from the `react-error-boundary` package (no first-party barrel involved).

### Frontend — `MentionPopup.tsx`

Add the package import:

```ts
import { ErrorBoundary } from 'react-error-boundary';
```

This is `react-error-boundary`'s own `ErrorBoundary`, not the app-level `components/ErrorBoundary` — see KAD "The popup boundary uses `react-error-boundary` directly." Do not import the app-level component here.

In the live branch of the body (the `deleted ? … : …` conditional from SF2), wrap `MentionPopupContent` in the boundary; `MentionPopupHeader` stays outside it:

```tsx
{deleted ? (
  <DeletedMentionContent entityType={entityType} />
) : (
  <>
    <MentionPopupHeader
      name={name}
      isPinned={isPinned}
      draggableProps={draggableProps}
      onPin={handlePin}
      onRemove={onRemove}
      onNavigate={handleNavigate}
    />
    <ErrorBoundary fallback={<DeletedMentionContent entityType={entityType} />}>
      <MentionPopupContent
        entityId={entityId}
        entityType={entityType}
        adventureId={adventureId}
      />
    </ErrorBoundary>
  </>
)}
```

`fallback` (typed `ReactNode`) is the correct prop of `react-error-boundary`'s `ErrorBoundary` for a static fallback that needs no access to the thrown error (verified against `react-error-boundary@6.1.2` — `ErrorBoundaryPropsWithFallback`). No `onReset`/`resetKeys` is needed: each `MentionPopup` is keyed by `entityId` in `PinnedPopupsProvider`, so a popup reused for a different entity is a fresh element with a fresh boundary, and a caught deleted popup correctly stays on the fallback until dismissed.

- **Purpose**: prevent a whole-screen crash when a live popup's per-entity content fetch throws `*NotFoundError` because the entity was deleted after the badge last resolved (multi-device delete race; pinned popup outliving its entity).
- **Behavior**: a render-phase throw from `MentionPopupContent`'s per-entity hook is caught by the boundary, which renders `DeletedMentionContent` in place of the entity body. The header is unaffected.
- **UI / Visual**: on catch, the popup shows the same muted "Deleted <Label>" body as a known-deleted mention, inside the existing `GlassPanel`.

### Test coverage

No test file. `MentionPopup.tsx` is a React component (Testing Policy forbids component tests); no helper or util is introduced.
