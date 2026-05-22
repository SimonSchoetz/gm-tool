# SPEC: MentionPopup Fixes + Domain Registration

## Progress Tracker

- SF1: Viewport clamping — clamp popup to viewport before first paint
- SF4: New domain popup components — FoePopupContent, PcPopupContent, FactionPopupContent, LocationPopupContent, ItemPopupContent [FOUNDATION]
- SF5: buildEntityPath domain registration — add 5 entity segments + tests
- SF6: domain-scaffold MentionPopup section — document popup registration as ambient system

> **Note:** SF2 (pinned-popup pointer-capture fix) and SF3 (EntityPopupBody circular import
> fix) are already implemented and must not be re-touched.

---

## Key Architectural Decisions

**Viewport clamping via `clampedPosition` state, not direct DOM mutation.** The style prop
re-applies `--rt-mention-pop-up-x` / `--rt-mention-pop-up-y` on every render. Direct
`style.setProperty` calls in `useLayoutEffect` would be silently overwritten on any re-render
not triggered by a position change (e.g., an `isPinned` toggle). A `clampedPosition` state
variable initialized from `dragPosition` and updated by `useLayoutEffect` persists through
unrelated re-renders. The style prop references `clampedPosition` — not `dragPosition` —
for the two custom properties.

**`useLayoutEffect` is required, not `useEffect`.** The clamp reads `getBoundingClientRect()`
and updates state. React processes `setState` calls from `useLayoutEffect` synchronously
before the browser paints. Using `useEffect` instead would allow the popup to appear
off-screen before jumping to the clamped position on the next paint.

**SF4 is a Foundation SF.** `MentionPopupContent.tsx` imports the five new components from
`'./components'`. The components barrel (`components/index.ts`) must be updated in the same
SF. If the barrel exports are missing, `MentionPopupContent.tsx` will fail tsc.

**No new data layer work for SF4.** All five domain detail hooks (`useFoe`, `usePc`,
`useFaction`, `useLocation`, `useItem`) are already implemented and exported from
`@/data-access-layer`. No DB, service, or DAL changes are required.

**All five new popup components use an identical shape.** Each delegates all rendering to
`EntityPopupBody`. There is no custom layout per entity. The substitution is mechanical and
the `NpcPopupContent` file is the authoritative reference.

---

## SF1: Viewport Clamping

Clamp the popup's rendered position to the visible viewport before first paint, fixing
overflow when a popup is spawned near a window edge.

### Files Affected

```
Modified: app/src/components/MentionPopup/MentionPopup.tsx
```

### Frontend

**`MentionPopup.tsx`** — three coordinated changes.

**1. Imports.** Change:

```tsx
import { useState } from 'react';
```

to:

```tsx
import { useState, useRef, useLayoutEffect } from 'react';
```

**2. New state and ref.** Add directly after the `const [isPinned, setIsPinned]` line:

```tsx
const popupRef = useRef<HTMLDivElement>(null);
const [clampedPosition, setClampedPosition] = useState(dragPosition);
```

`dragPosition` is typed `{ x: number; y: number }` from `useDraggable`. `clampedPosition`
inherits the same type via inference.

**3. `useLayoutEffect`.** Add after the `clampedPosition` declaration:

```tsx
useLayoutEffect(() => {
  // Reads popup dimensions via getBoundingClientRect to clamp position within
  // viewport; must apply before first paint to prevent the popup appearing
  // off-screen when spawned near a window boundary
  if (!popupRef.current) return;
  const { width, height } = popupRef.current.getBoundingClientRect();
  const x = Math.max(0, Math.min(dragPosition.x, window.innerWidth - width));
  const y =
    placement === 'below'
      ? Math.max(0, Math.min(dragPosition.y, window.innerHeight - height))
      : Math.max(height, Math.min(dragPosition.y, window.innerHeight));
  setClampedPosition({ x, y });
}, [dragPosition.x, dragPosition.y, placement]);
```

Placement-specific `y` semantics:
- `below`: `y` is the top edge of the popup. Clamp to `[0, viewportHeight − height]`.
- `above`: `y` is the bottom anchor of the popup (CSS `bottom: calc(100vh - y)` places the
  bottom edge at `y` from the viewport top). Clamp to `[height, viewportHeight]` so the top
  edge (`y − height`) stays ≥ 0.

**4. Style prop.** Change the two custom property references in the `style` prop from
`dragPosition` to `clampedPosition`:

```tsx
style={
  {
    '--rt-mention-pop-up-x': `${clampedPosition.x}px`,
    '--rt-mention-pop-up-y': `${clampedPosition.y}px`,
    ...(zIndex !== undefined && { zIndex }),
  } as React.CSSProperties
}
```

**5. ref on GlassPanel.** Add `ref={popupRef}` to the `GlassPanel` element. `GlassPanel`
accepts `HtmlProps<'div'>` which is `JSX.IntrinsicElements['div']`; this type includes
`ref?: React.Ref<HTMLDivElement>` via `DetailedHTMLProps → ClassAttributes → RefAttributes`.
The `ref` travels through `GlassPanel`'s `{...props}` spread onto its inner `<div>`.

The `GlassPanel` opening tag becomes:

```tsx
<GlassPanel
  ref={popupRef}
  intensity='bright'
  className={cn('mention-popup', `mention-popup--${placement}`)}
  style={ ... }
  ...
>
```

`dragPosition` remains used — it appears in the `useLayoutEffect` dep array and body — so
`noUnusedLocals` does not fire.

---

## SF4: New Domain Popup Components

[FOUNDATION: SF4 itself must be committed as a unit — the barrel, the five new components,
and the MentionPopupContent switch must all be complete before baseline checks are run. Do
not run baseline checks after any partial SF4 state.]

Create popup body components for the five entity types missing from `MentionPopupContent`.

### Files Affected

```
New: app/src/components/MentionPopup/components/MentionPopupContent/components/FoePopupContent/FoePopupContent.tsx
New: app/src/components/MentionPopup/components/MentionPopupContent/components/FoePopupContent/FoePopupContent.css
New: app/src/components/MentionPopup/components/MentionPopupContent/components/PcPopupContent/PcPopupContent.tsx
New: app/src/components/MentionPopup/components/MentionPopupContent/components/PcPopupContent/PcPopupContent.css
New: app/src/components/MentionPopup/components/MentionPopupContent/components/FactionPopupContent/FactionPopupContent.tsx
New: app/src/components/MentionPopup/components/MentionPopupContent/components/FactionPopupContent/FactionPopupContent.css
New: app/src/components/MentionPopup/components/MentionPopupContent/components/LocationPopupContent/LocationPopupContent.tsx
New: app/src/components/MentionPopup/components/MentionPopupContent/components/LocationPopupContent/LocationPopupContent.css
New: app/src/components/MentionPopup/components/MentionPopupContent/components/ItemPopupContent/ItemPopupContent.tsx
New: app/src/components/MentionPopup/components/MentionPopupContent/components/ItemPopupContent/ItemPopupContent.css
Modified: app/src/components/MentionPopup/components/MentionPopupContent/components/index.ts
Modified: app/src/components/MentionPopup/components/MentionPopupContent/MentionPopupContent.tsx
```

### Frontend

**New component files — substitution from `NpcPopupContent`.**

Reference: `app/src/components/MentionPopup/components/MentionPopupContent/components/NpcPopupContent/NpcPopupContent.tsx`

All five new components are pure mechanical substitutions. Do not reproduce the file body —
apply this substitution table to each new file:

| Identifier in reference | `FoePopupContent` | `PcPopupContent` | `FactionPopupContent` | `LocationPopupContent` | `ItemPopupContent` |
|---|---|---|---|---|---|
| `NpcPopupContent` (component name) | `FoePopupContent` | `PcPopupContent` | `FactionPopupContent` | `LocationPopupContent` | `ItemPopupContent` |
| `useNpc` | `useFoe` | `usePc` | `useFaction` | `useLocation` | `useItem` |
| `npc` (variable) | `foe` | `pc` | `faction` | `location` | `item` |
| `loading` (from hook) | `loading` | `loading` | `loading` | `loading` | `loading` |
| `` `npc-popup-${entityId}` `` | `` `foe-popup-${entityId}` `` | `` `pc-popup-${entityId}` `` | `` `faction-popup-${entityId}` `` | `` `location-popup-${entityId}` `` | `` `item-popup-${entityId}` `` |
| `'./NpcPopupContent.css'` | `'./FoePopupContent.css'` | `'./PcPopupContent.css'` | `'./FactionPopupContent.css'` | `'./LocationPopupContent.css'` | `'./ItemPopupContent.css'` |

The `EntityPopupBody` import `'../EntityPopupBody'` is **unchanged** across all five files.
Verification: each new file is at `components/[Name]/[Name].tsx`; `'../EntityPopupBody'`
resolves to `components/EntityPopupBody/` which has an `index.ts` barrel — the directory
(barrel) form is correct.

The `@/data-access-layer` import path is unchanged. All five hooks (`useFoe`, `usePc`,
`useFaction`, `useLocation`, `useItem`) are exported from `@/data-access-layer` (confirmed
in `data-access-layer/index.ts`).

**New CSS files.** Each companion `.css` file is empty. Each new component file imports its
CSS via the corresponding relative path in the substitution table. The CSS import is required
even though the file is empty — the component-CSS pairing convention applies.

**`components/index.ts`** — add five named exports using the explicit double-name file form
(no `index.ts` exists inside the new component directories, so the barrel form would not
resolve). The file becomes:

```ts
export { NpcPopupContent } from './NpcPopupContent/NpcPopupContent';
export { EntityPopupBody } from './EntityPopupBody';
export { FoePopupContent } from './FoePopupContent/FoePopupContent';
export { PcPopupContent } from './PcPopupContent/PcPopupContent';
export { FactionPopupContent } from './FactionPopupContent/FactionPopupContent';
export { LocationPopupContent } from './LocationPopupContent/LocationPopupContent';
export { ItemPopupContent } from './ItemPopupContent/ItemPopupContent';
```

**`MentionPopupContent.tsx`** — two changes:

1. Extend the named import from `'./components'` to include all five new components.
2. Add five cases to the switch. The complete switch body becomes:

```tsx
switch (entityType) {
  case 'npcs':
    return <NpcPopupContent entityId={entityId} adventureId={adventureId} />;
  case 'foes':
    return <FoePopupContent entityId={entityId} adventureId={adventureId} />;
  case 'pcs':
    return <PcPopupContent entityId={entityId} adventureId={adventureId} />;
  case 'factions':
    return <FactionPopupContent entityId={entityId} adventureId={adventureId} />;
  case 'locations':
    return <LocationPopupContent entityId={entityId} adventureId={adventureId} />;
  case 'items':
    return <ItemPopupContent entityId={entityId} adventureId={adventureId} />;
  default:
    return null;
}
```

`noFallthroughCasesInSwitch` is satisfied — every case ends with `return`.

---

## SF5: buildEntityPath Domain Registration

Register the five missing entity types so the Navigate button works for all popup types.

### Files Affected

```
Modified: app/domain/mentions/buildEntityPath.ts
Modified: app/domain/mentions/__tests__/buildEntityPath.test.ts
```

### Domain

**`buildEntityPath.ts`** — extend `ENTITY_SEGMENT`. Route files confirm each segment string:
`adventure.$adventureId.foe.$foeId.tsx` → `foe`, and so on.

```ts
const ENTITY_SEGMENT: Record<string, string> = {
  npcs: 'npc',
  sessions: 'session',
  foes: 'foe',
  pcs: 'pc',
  factions: 'faction',
  locations: 'location',
  items: 'item',
};
```

The function body and signature are unchanged.

**`buildEntityPath.test.ts`** — add one test per new entity type. No singleton state is
involved (`buildEntityPath` is a pure function). Static imports at the file top are correct.
Existing tests are unchanged.

Add after the existing `'returns root-scoped session path'` test and before the
`'throws for unknown entity types'` test:

```ts
it('returns adventure-scoped foe path', () => {
  expect(buildEntityPath('foes', 'foe-1', 'adv-1')).toBe(
    '/adventure/adv-1/foe/foe-1',
  );
});

it('returns adventure-scoped pc path', () => {
  expect(buildEntityPath('pcs', 'pc-1', 'adv-1')).toBe(
    '/adventure/adv-1/pc/pc-1',
  );
});

it('returns adventure-scoped faction path', () => {
  expect(buildEntityPath('factions', 'faction-1', 'adv-1')).toBe(
    '/adventure/adv-1/faction/faction-1',
  );
});

it('returns adventure-scoped location path', () => {
  expect(buildEntityPath('locations', 'location-1', 'adv-1')).toBe(
    '/adventure/adv-1/location/location-1',
  );
});

it('returns adventure-scoped item path', () => {
  expect(buildEntityPath('items', 'item-1', 'adv-1')).toBe(
    '/adventure/adv-1/item/item-1',
  );
});
```

---

## SF6: domain-scaffold MentionPopup Section

Document the MentionPopup registration requirement so future domain implementations include
it automatically.

### Files Affected

```
Modified: app/docs/_product/domain-scaffold.md
```

### Documentation

Add a new `### MentionPopup Registration` section to `domain-scaffold.md` after the
`### Seed Config` section and before `## Customization Points`. Full section content:

```markdown
### MentionPopup Registration

Every domain entity that supports tagging must be registered in two places so that hovering
a mention tag displays the entity's popup body and the Navigate button routes correctly.

**`domain/mentions/buildEntityPath.ts`** (Modified) — add one entry to `ENTITY_SEGMENT`:

\`\`\`ts
[plural]: '[singular]',
\`\`\`

Segment string is the route's singular path segment, matching the detail route file name
`adventure.$adventureId.[singular].$[singular]Id.tsx`.

**`src/components/MentionPopup/components/MentionPopupContent/components/`** (New directory) —
create `[Singular]PopupContent/[Singular]PopupContent.tsx` and
`[Singular]PopupContent/[Singular]PopupContent.css` (empty). Reference:
`NpcPopupContent/NpcPopupContent.tsx`. Substitution:
`NpcPopupContent → [Singular]PopupContent`, `useNpc → use[Singular]`,
`npc → [singular]`, `` `npc-popup-${entityId}` → `[singular]-popup-${entityId}` ``.

**`MentionPopupContent/components/index.ts`** (Modified) — add:

\`\`\`ts
export { [Singular]PopupContent } from './[Singular]PopupContent/[Singular]PopupContent';
\`\`\`

**`MentionPopupContent/components/MentionPopupContent.tsx`** (Modified) — add one case to
the `switch (entityType)` block:

\`\`\`tsx
case '[plural]':
  return <[Singular]PopupContent entityId={entityId} adventureId={adventureId} />;
\`\`\`
```

---

## CLAUDE.md Impact

`app/docs/_product/domain-scaffold.md` — add MentionPopup Registration section as documented
in SF6. No other CLAUDE.md files are affected. No new structural patterns are introduced that
require convention documentation.
