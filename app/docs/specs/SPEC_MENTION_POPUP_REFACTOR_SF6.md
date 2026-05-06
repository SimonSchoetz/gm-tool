# SF6: NpcPopupContent Update

Refactor `NpcPopupContent` to use `EntityPopupBody`, switch from `npc.description` to `npc.summary`, and apply `.avatar-dimensions` to the loading state.

---

## Files Affected

- Modified: `app/src/components/MentionPopupContent/components/NpcPopupContent/NpcPopupContent.tsx`
- Modified: `app/src/components/MentionPopupContent/components/NpcPopupContent/NpcPopupContent.css`

---

## Frontend

**Purpose:** Wire the NPC domain data into the `EntityPopupBody` layout established in SF5. Replace the bespoke inline layout with the shared component. Use the `summary` field (short text) instead of `description` (full rich text).

**Behavior:**

- Calls `useNpc(entityId, adventureId ?? '')` as before.
- Loading state: renders a loading indicator using `.npc-popup-loading avatar-dimensions` — preserves the 200px placeholder space to prevent layout jump.
- Loaded, no NPC: returns `null`.
- Loaded, NPC found: renders `<EntityPopupBody>` with `summary` and `image_id` mapped from the NPC.
  - `npc.summary` is `string | undefined` in the DB type. Pass as `npc.summary ?? null` to satisfy `EntityPopupBody`'s `string | null` interface (CLAUDE.md: undefined is not used as a domain value).
  - `npc.image_id` is `string | null | undefined`. Pass as `npc.image_id ?? null`.

**UI / Visual:**

Loading state occupies the same 200px square footprint as the avatar image (via `.avatar-dimensions`). Loaded state: image left + summary right, with no placeholder if either is absent.

```tsx
// NpcPopupContent.tsx
import { FCProps } from '@/types';
import { useNpc } from '@/data-access-layer';
import { EntityPopupBody } from '../EntityPopupBody/EntityPopupBody';
import './NpcPopupContent.css';

type Props = {
  entityId: string;
  adventureId: string | null;
};

export const NpcPopupContent: FCProps<Props> = ({ entityId, adventureId }) => {
  const { npc, loading } = useNpc(entityId, adventureId ?? '');

  if (loading) return <div className='npc-popup-loading avatar-dimensions' />;
  if (!npc) return null;

  return (
    <EntityPopupBody
      summary={npc.summary ?? null}
      imageId={npc.image_id ?? null}
    />
  );
};
```

Note: `EntityPopupBody` is imported via relative path `../EntityPopupBody/EntityPopupBody` — sibling imports within `components/` use relative paths, never the barrel (circular dependency rule).

Remove imports: `ImageById` (no longer used directly), `TextEditor` (no longer used).

---

### NpcPopupContent.css

Remove `.npc-popup-content` and `.npc-popup-image` — superseded by `EntityPopupBody.css`.
Remove explicit `width`/`height` from `.npc-popup-loading` — dimensions come from `.avatar-dimensions` applied in JSX.

```css
/* NpcPopupContent.css */
.npc-popup-loading {
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--color-text-muted);
}
```
