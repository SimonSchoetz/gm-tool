# SF8: Live badge rendering + deletion fallback

Wires SF3's live-resolution hook into `MentionBadge`, renders the deleted-entity fallback, and opportunistically re-snapshots the node's stored `displayName`/`color` whenever a fresh resolution differs from them — the mechanism behind the root spec's KAD "The node's stored displayName/color become a fallback snapshot, not the source of truth."

## Files affected

**Modified:**

- `TextEditor/nodes/MentionNode.tsx` — add `setDisplayName`/`setColor`, pass `nodeKey` from `decorate()`
- `TextEditor/components/MentionBadge/MentionBadge.tsx`
- `TextEditor/components/MentionBadge/MentionBadge.css`

## Layered breakdown

### Frontend — `TextEditor/nodes/MentionNode.tsx`

Add two setters to the `MentionNode` class, following the exact `getWritable()` pattern SF5's `toggleMentionFormat` already established:

```ts
setDisplayName(displayName: string): this {
  const self = this.getWritable();
  self.__displayName = displayName;
  return self;
}

setColor(color: string): this {
  const self = this.getWritable();
  self.__color = color;
  return self;
}
```

Update `decorate()` to also pass the node's own key:

```ts
decorate(): JSX.Element {
  return (
    <MentionBadge
      entityId={this.__entityId}
      entityType={this.__entityType}
      displayName={this.__displayName}
      color={this.__color}
      adventureId={this.__adventureId}
      format={this.__mentionFormats}
      nodeKey={this.getKey()}
    />
  );
}
```

### Frontend — `TextEditor/components/MentionBadge/MentionBadge.tsx`

Add to `Props`: `nodeKey: NodeKey`. Add imports: `NodeKey`, `$getNodeByKey` from `'lexical'`; `useLexicalComposerContext` from `'@lexical/react/LexicalComposerContext'`; `useMentionEntityData`, `useTableConfigs` from `'@/data-access-layer'`; `import type { MentionNode } from '../../nodes';`.

**Why a type-only import, not `$isMentionNode`:** `MentionNode.tsx` imports `MentionBadge` (for `decorate()`); if `MentionBadge.tsx` imported a value (e.g. `$isMentionNode`) from `../../nodes`, that would be a real circular module dependency — `MentionNode.tsx` → `MentionBadge.tsx` → `nodes/index.ts` → back to `MentionNode.tsx`. A `import type` is fully erased at compile time (this project has `isolatedModules: true`, and the existing codebase already writes type-only imports as `import type` throughout), so it carries no runtime module dependency and creates no cycle. This is safe to rely on without a runtime type guard: `nodeKey` is always `this.getKey()` of the exact `MentionNode` instance that rendered this exact `MentionBadge`, and a Lexical node's class never changes after construction — if `$getNodeByKey` returns non-null for that key, it is a `MentionNode`, so a plain null-check is sufficient narrowing (unlike SF6/SF7, which inspect an arbitrary selection that may contain nodes of any type and therefore need the real `$isMentionNode` runtime guard).

Add the new hooks, resolved values, and effect (placed after the existing `usePinnedPopups`/ref declarations, before the existing hover-handler functions — hook call order is unaffected since all hooks still run unconditionally on every render):

```tsx
const [editor] = useLexicalComposerContext();
const { name: liveName, deleted, loading } = useMentionEntityData(
  entityId,
  entityType,
);
const { tableConfigs } = useTableConfigs();

const tableConfig = tableConfigs.find((c) => c.table_name === entityType);
const resolvedColor = tableConfig?.color ?? color;
const resolvedName = !loading && liveName !== null ? liveName : displayName;
```

Update `showPopupFromBadge`'s call to `showPopup` to use `resolvedName` instead of `displayName` for the `name` field — the hover popup must show the same live name the badge itself now shows, not the stale snapshot:

```ts
showPopup({
  entityId,
  entityType,
  adventureId: adventureId ?? null,
  name: resolvedName,
  // ...position, placement, onMouseEnterBridge, onMouseLeaveBridge unchanged
});
```

Add the re-snapshot effect (placed after the existing cleanup `useEffect`):

```tsx
useEffect(() => {
  if (loading || deleted || liveName === null) return;
  if (liveName === displayName && resolvedColor === color) return;

  editor.update(() => {
    const node = $getNodeByKey<MentionNode>(nodeKey);
    if (node === null) return;
    node.setDisplayName(liveName);
    node.setColor(resolvedColor);
  });
}, [editor, nodeKey, loading, deleted, liveName, resolvedColor, displayName, color]);
```

Replace the final return with a deleted-state branch before the existing badge markup:

```tsx
if (deleted) {
  return (
    <span className={cn('mention-badge', 'mention-badge--deleted')}>
      {displayName}
    </span>
  );
}
```

No `format`-derived class is applied in the deleted branch — deliberate, per root spec KAD "The deleted-entity visual state ignores the node's format field entirely."

```tsx
return (
  <span
    ref={badgeRef}
    className={cn(
      'mention-badge',
      format.includes('bold') && 'mention-badge--bold',
      format.includes('italic') && 'mention-badge--italic',
    )}
    style={
      {
        '--rt-mention-pop-up-color': resolvedColor,
        '--mention-badge-text-decoration': buildMentionTextDecoration(format),
      } as React.CSSProperties
    }
    onClick={handleClick}
    onMouseEnter={handleBadgeMouseEnter}
    onMouseLeave={handleBadgeMouseLeave}
  >
    {resolvedName}
  </span>
);
```

The deleted branch renders `displayName` (the node's stored snapshot), not `resolvedName` — when `deleted` is true, `liveName` is always `null` (SF2), so `resolvedName` would already equal `displayName` in that case too; using `displayName` directly here states the intent plainly (this is the last-known snapshot, not a live value) rather than relying on a coincidental equality. The deleted span has no `ref`, `onClick`, or hover handlers — it is inert text, matching the AC that a deleted mention is "no longer clickable/linked."

### Frontend — `TextEditor/components/MentionBadge/MentionBadge.css`

Add:

```css
.mention-badge--deleted {
  cursor: text;
  color: var(--color-text-muted);
  font-weight: var(--font-weight-bold);
}
```

`cursor: text` overrides the base `.mention-badge` rule's `cursor: pointer` — the deleted state is inert, so it must not visually imply it is still clickable. `--color-text-muted` and `--font-weight-bold` are existing tokens already declared in `styles/variables/color-variables.css` and `styles/variables/typography-variables.css` — no new token is added.

## Test coverage

No test file is added. `MentionBadge.tsx` and `MentionNode.tsx` are unaffected by this sub-feature's test posture from SF4/SF5: the former is a component (root Testing Policy forbids component tests), the latter is a Lexical node class with no established test convention either way in this codebase.
