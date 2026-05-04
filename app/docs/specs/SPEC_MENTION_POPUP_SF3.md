# SF3: MentionPopupContent + NpcPopupContent

Create the entity-type dispatch component and the NPC-specific content component. These are consumed by `MentionPopup` (SF4) as its body.

## Files Affected

**New:**

- `app/src/components/MentionPopupContent/MentionPopupContent.tsx`
- `app/src/components/MentionPopupContent/MentionPopupContent.css`
- `app/src/components/MentionPopupContent/components/NpcPopupContent/NpcPopupContent.tsx`
- `app/src/components/MentionPopupContent/components/NpcPopupContent/NpcPopupContent.css`
- `app/src/components/MentionPopupContent/components/index.ts`
- `app/src/components/MentionPopupContent/index.ts`

**Modified:**

- `app/src/components/index.ts` — add MentionPopupContent named export

## Frontend

### MentionPopupContent.tsx

**Purpose:** Dispatches to the correct entity-specific content component based on `entityType`. Renders nothing for unknown entity types.

**Behavior:** A switch on `entityType`. Currently only `'npcs'` is handled:

- `entityType === 'npcs'` → renders `<NpcPopupContent entityId={entityId} adventureId={adventureId} />`
- any other value → returns `null`

**Props:** Case 3 — closed API.

```ts
type Props = {
  entityId: string;
  entityType: string;
  adventureId: string | null;
};
```

Import `FCProps` from `@/types`. Import `NpcPopupContent` from `./components`.

**UI / Visual:** No visual of its own — delegates entirely to the content component.

---

### MentionPopupContent.css

Empty file. The component itself has no visual. Create the file so the pattern is consistent with every component having a co-located `.css` file.

---

### NpcPopupContent.tsx

**Purpose:** Renders the NPC-specific popup body: a square image followed by the NPC's description in read-only mode.

**Behavior:**

- Calls `useNpc(entityId, adventureId ?? '')` from `@/data-access-layer`. Pass `adventureId ?? ''` when `adventureId` is null (the hook uses it only for list cache invalidation on mutations; fetching by `npcId` is not affected).
- If `loading` is true, render a minimal loading placeholder (e.g., a `<div>` with class `npc-popup-loading`).
- If `npc` is null and loading is false, return `null`.
- When `npc` is available:
  - Render `<ImageById imageId={npc.image_id ?? null} className='npc-popup-image' />`.
  - Render `<TextEditor value={npc.description ?? ''} textEditorId={`npc-popup-${entityId}`} readOnly />`.

`npc.image_id` is typed `string | null | undefined` from the db schema. The expression `npc.image_id ?? null` collapses `undefined` to `null`, satisfying `ImageById`'s `imageId: string | null` prop.

**Props:** Case 3 — closed API.

```ts
type Props = {
  entityId: string;
  adventureId: string | null;
};
```

Import `FCProps` from `@/types`. Import `ImageById`, `TextEditor` from `@/components`. Import `useNpc` from `@/data-access-layer`.

**UI / Visual:**

- Root element: `<div className='npc-popup-content'>` — flex column, gap between image and description.
- Image: `className='npc-popup-image'` — width and height both 200px, `object-fit: cover`, `border-radius: var(--radius-md)`.
- TextEditor renders below the image with no additional wrapper. Since `TextEditor` uses `FCProps<Props>` and already composes a `LexicalComposer`, no extra structural wrapper is needed.

---

### NpcPopupContent.css

```css
.npc-popup-content {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-sm);
}

.npc-popup-image {
  width: 200px;
  height: 200px;
  object-fit: cover;
  border-radius: var(--radius-md);
}

.npc-popup-loading {
  width: 200px;
  height: 200px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--color-text-muted);
}
```

---

### MentionPopupContent/components/index.ts

Grouping barrel — explicit named exports, no `export *`. `NpcPopupContent` has no internal sub-structure, so no own `index.ts` is needed for it.

```ts
export { NpcPopupContent } from './NpcPopupContent/NpcPopupContent';
```

---

### MentionPopupContent/index.ts

Module directory barrel.

```ts
export { MentionPopupContent } from './MentionPopupContent';
```

---

### components/index.ts

Add one line:

```ts
export { MentionPopupContent } from './MentionPopupContent';
```
