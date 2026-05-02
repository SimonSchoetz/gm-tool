# SF4: Header Refactor

Simplify `Header.tsx` to render `<BreadcrumbList />` and remove all regex parsing, data hooks, and helper functions. Clean up the dead `h1` CSS rule from `Header.css`.

## Files Affected

**Modified:**

- `app/src/components/Header/Header.tsx`
- `app/src/components/Header/Header.css`

## Frontend

### Header.tsx

**Purpose:** Thin shell that wraps `BreadcrumbList` in the `GlassPanel` layout frame. No data fetching, no routing logic.

**Behavior:**

Read the file immediately before editing. [S_1: app/src/components/Header/Header.tsx]

Remove the following in full:

- Import of `useAdventure, useNpc, useSession` from `@/data-access-layer`
- Import of `useRouterState` from `@tanstack/react-router`
- All regex variables: `adventureIdMatch`, `adventureId`, `npcIdMatch`, `npcId`, `sessionIdMatch`, `sessionId`
- All hook calls: `useAdventure(adventureId)`, `useNpc(npcId, adventureId)`, `useSession(sessionId, adventureId)`
- All helper functions: `getMainRoute`, `getRouteLevel1`, `getRouteLevel2`, `getHeading`

Add:

- Import of `BreadcrumbList` from `'./components'`

Replace the `<GlassPanel>` content: replace `<h1>{getHeading()}</h1>` with `<BreadcrumbList />`.

The resulting component body:

```tsx
import { FCProps } from '@/types';
import './Header.css';
import GlassPanel from '../GlassPanel/GlassPanel';
import { cn } from '@/util';
import { BreadcrumbList } from './components';

type Props = object;

export const Header: FCProps<Props> = ({ ...props }) => {
  return (
    <header>
      <GlassPanel className={cn('header-content')} {...props}>
        <BreadcrumbList />
      </GlassPanel>
    </header>
  );
};
```

**UI / Visual:**

- `GlassPanel` with class `header-content` is unchanged — it remains a flex row container with `align-items: center` from `Header.css`. [S_2: app/src/components/Header/Header.css:1-6]
- `BreadcrumbList` renders inside the panel and inherits the flex-row alignment.
- No `h1` element remains after the refactor.

**Props:** `type Props = object` — unchanged.

---

### Header.css

**Cleanup:** Remove the `.header-content h1` rule — it targets an element that no longer exists in the component after the `<h1>` is replaced by `<BreadcrumbList />`. [S_3: app/src/components/Header/Header.css:9-15]

The `.header-content` rule stays unchanged:

```css
.header-content {
  padding: var(--spacing-md);
  height: 100%;
  display: flex;
  align-items: center;
}
```

Final file content after removing the `h1` rule:

```css
.header-content {
  padding: var(--spacing-md);
  height: 100%;
  display: flex;
  align-items: center;
}
```
