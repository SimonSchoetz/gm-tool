# SF2: Crumb Sub-components

Create the three entity crumb components and their grouping barrel. Each component is self-contained: it reads its own URL params and fetches its own data.

## Files Affected

**New:**

- `app/src/components/Header/components/AdventureCrumb.tsx`
- `app/src/components/Header/components/SessionCrumb.tsx`
- `app/src/components/Header/components/NpcCrumb.tsx`
- `app/src/components/Header/components/index.ts`

## Frontend

### AdventureCrumb.tsx

**Purpose:** Renders the adventure segment of the breadcrumb as a navigable link using the current adventure's name. Fetches the adventure itself — does not receive any props.

**Behavior:**

- Call `useParams({ strict: false })` from `@tanstack/react-router`. [S_1: app/node_modules/@tanstack/react-router/dist/esm/useParams.d.ts:21] Cast the result to `{ adventureId?: string }` before destructuring, because `strict: false` returns a loosely typed union of all possible params.
- Pass `adventureId ?? ''` to `useAdventure`. The query is disabled when `adventureId` is empty (`enabled: !!adventureId` is already in the hook). [S_2: app/src/data-access-layer/adventures/useAdventure.ts:32]
- Render `<Link to="/adventure/$adventureId" params={{ adventureId: adventureId ?? '' }}>{adventure?.name ?? '…'}</Link>`.
- While `adventure` is `null` (loading), display `'…'` as the link text.

**UI / Visual:**

- A single `<Link>` element. No wrapper element. No additional markup.
- The `Link` renders as an `<a>` by default.

**Props:** None. `type Props = Record<string, never>`. Typed as `FCProps<Props>`.

**Imports:**
- `useParams, Link` from `@tanstack/react-router` [S_3: app/node_modules/@tanstack/react-router/dist/esm/index.d.ts:15,32]
- `useAdventure` from `@/data-access-layer` [S_4: app/src/data-access-layer/index.ts:1]
- `FCProps` from `@/types` [S_5: app/src/types/index.ts:2]

---

### SessionCrumb.tsx

**Purpose:** Renders the session segment of the breadcrumb as a navigable link using the current session's name.

**Behavior:**

- Call `useParams({ strict: false })` and cast the result to `{ adventureId?: string; sessionId?: string }`.
- Pass `sessionId ?? ''` and `adventureId ?? ''` to `useSession`. [S_6: app/src/data-access-layer/sessions/useSession.ts:15]
- Render `<Link to="/adventure/$adventureId/session/$sessionId" params={{ adventureId: adventureId ?? '', sessionId: sessionId ?? '' }}>{session?.name ?? '…'}</Link>`.
- While `session` is `null`, display `'…'`.

**UI / Visual:** A single `<Link>` element. No wrapper element.

**Props:** None. `type Props = Record<string, never>`. Typed as `FCProps<Props>`.

**Imports:**
- `useParams, Link` from `@tanstack/react-router`
- `useSession` from `@/data-access-layer` [S_7: app/src/data-access-layer/index.ts:4]
- `FCProps` from `@/types`

---

### NpcCrumb.tsx

**Purpose:** Renders the NPC segment of the breadcrumb as a navigable link using the current NPC's name.

**Behavior:**

- Call `useParams({ strict: false })` and cast the result to `{ adventureId?: string; npcId?: string }`.
- Pass `npcId ?? ''` and `adventureId ?? ''` to `useNpc`. [S_8: app/src/data-access-layer/npcs/useNpc.ts:16]
- Render `<Link to="/adventure/$adventureId/npc/$npcId" params={{ adventureId: adventureId ?? '', npcId: npcId ?? '' }}>{npc?.name ?? '…'}</Link>`.
- While `npc` is `null`, display `'…'`.

**UI / Visual:** A single `<Link>` element. No wrapper element.

**Props:** None. `type Props = Record<string, never>`. Typed as `FCProps<Props>`.

**Imports:**
- `useParams, Link` from `@tanstack/react-router`
- `useNpc` from `@/data-access-layer` [S_9: app/src/data-access-layer/index.ts:3]
- `FCProps` from `@/types`

---

### components/index.ts

Grouping barrel for the `Header/components/` directory. Explicit named exports only — no `export *`. Per CLAUDE.md, a flat single-file sub-component is exported directly from the barrel with no intermediate barrel needed. [S_10: app/src/CLAUDE.md — Component Library]

```ts
export { BreadcrumbList } from './BreadcrumbList';
export { AdventureCrumb } from './AdventureCrumb';
export { SessionCrumb } from './SessionCrumb';
export { NpcCrumb } from './NpcCrumb';
```

`BreadcrumbList` is introduced in SF3 — this barrel file must be written to include all four exports at that time. If created in SF2 before SF3 is implemented, include only the three crumb exports and add `BreadcrumbList` in SF3.

## Cross-SF Symbol Lifecycle

`AdventureCrumb`, `SessionCrumb`, and `NpcCrumb` are exported from `components/index.ts` here and consumed in SF3 by `BreadcrumbList.tsx` which imports them to render entity-kind items.
