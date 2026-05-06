# SF5: EntityPopupBody

New generic sub-component in `MentionPopupContent/components/` that renders the popup content body — image on the left, summary on the right.

---

## Files Affected

- New: `app/src/components/MentionPopupContent/components/EntityPopupBody/EntityPopupBody.tsx`
- New: `app/src/components/MentionPopupContent/components/EntityPopupBody/EntityPopupBody.css`
- Modified: `app/src/components/MentionPopupContent/components/index.ts`

---

## Frontend

**Purpose:** Provide a shared, reusable layout for popup content across all entity types. `NpcPopupContent` (SF6) and future domain content components (Monsters, Factions, PCs) render this component with their entity-specific data mapped to the `{ summary, imageId }` interface.

**Behavior:**

- If `imageId` is not null: renders `<ImageById>` on the left.
- If `imageId` is null: image area is omitted entirely — no placeholder rendered.
- `<ImageById>` is never called with `null` to avoid a TanStack Query pending-state issue (`enabled: false` leaves `isPending: true`).
- If `summary` is not null: renders summary text on the right.
- If `summary` is null: summary area is omitted.
- Loading states are handled by the parent domain content component (e.g., `NpcPopupContent`) — `EntityPopupBody` renders only resolved data.

**UI / Visual:**

Horizontal flex row: image (left, fixed 200px square via `.avatar-dimensions`) + summary text (right, fills remaining space, scrollable if overflow).

```tsx
// EntityPopupBody.tsx
import { FCProps } from '@/types';
import { ImageById } from '../../../ImageById/ImageById';
import './EntityPopupBody.css';

type Props = {
  summary: string | null;
  imageId: string | null;
};

export const EntityPopupBody: FCProps<Props> = ({ summary, imageId }) => (
  <div className='entity-popup-body'>
    {imageId !== null && (
      <ImageById
        imageId={imageId}
        className='entity-popup-image avatar-dimensions'
      />
    )}
    {summary !== null && (
      <div className='entity-popup-summary'>{summary}</div>
    )}
  </div>
);
```

Note: `ImageById` is imported via relative path `../../../ImageById/ImageById` — sibling imports within `components/` use relative paths, never `@/components` (circular dependency rule).

```css
/* EntityPopupBody.css */
.entity-popup-body {
  display: flex;
  gap: var(--spacing-sm);
}

.entity-popup-image {
  object-fit: cover;
  border-radius: var(--radius-md);
  flex-shrink: 0;
}

.entity-popup-summary {
  overflow-y: auto;
}
```

`.avatar-dimensions` from `global.css` supplies `width` and `aspect-ratio` to the image element. `.entity-popup-image` adds only image-specific properties (`object-fit`, `border-radius`, `flex-shrink`).

---

### Barrel — `MentionPopupContent/components/index.ts`

Verified current barrel: `export { NpcPopupContent } from './NpcPopupContent/NpcPopupContent';` — explicit named export, correct convention.

After change:

```ts
export { NpcPopupContent } from './NpcPopupContent/NpcPopupContent';
export { EntityPopupBody } from './EntityPopupBody/EntityPopupBody';
```

`EntityPopupBody` does not have its own `index.ts` — it has no `helper/` or `components/` subdirectory. Exported directly from the grouping barrel by filename reference.

**Cross-SF symbol lifecycle:** `EntityPopupBody` is consumed by `NpcPopupContent` in SF6.
