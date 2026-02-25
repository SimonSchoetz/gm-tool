# SPEC: Data Access Layer Refactor

## Before anything else

Read all CLAUDE.md files!

## Purpose

Rename `src/providers/` to `src/data-access-layer/` and converge all domain modules to a single pattern: TanStack Query hooks + query key factory, no React Context. The NPC module is the reference implementation — all other modules adopt the same shape.

## Progress tracker

- [x] Sub-feature 1: Rename directory — move `providers/` to `data-access-layer/`, update all imports, update CLAUDE.md
- [x] Sub-feature 2: Adventures — drop Context, add key factory, convert to pure hooks
- [x] Sub-feature 3: Table Config — drop Context, add key factory, reshape hooks
- [x] Sub-feature 4: Images — create service layer, then convert to pure hooks
- [ ] Sub-feature 5: Sessions — create service layer, then convert to pure hooks
- [ ] Sub-feature 6: Remove DataProvider — inline remaining wrappers or remove entirely

---

## Sub-feature 1: Rename directory

Move `src/providers/` to `src/data-access-layer/` and update all references. No behavioral changes.

### Provider / hooks

- Rename directory `src/providers/` to `src/data-access-layer/`
- Rename `DataProvider.tsx` to `DataAccessProvider.tsx` (temporary — removed in sub-feature 6)
- Update the component name inside to match
- The barrel `data-access-layer/index.ts` still exports `DataAccessProvider` for now — cleaned up in sub-feature 6

### Frontend

- Update all import paths across screens, components, App.tsx
- Update the `@/` alias if one exists, or just update relative/aliased imports
- Verify the app compiles and runs after rename

### CLAUDE.md updates

- `app/src/CLAUDE.md`: update the structure tree:
  - Replace `providers/` with `data-access-layer/`
  - Update description to: `data-access-layer/ # domain data hooks (TanStack Query)`
  - Replace the example directory structure (`providerA/ProviderA.tsx`, `useProviderA.ts`) with the new shape:
    ```
    data-access-layer/
    ├── domainA/
    │   ├── index.ts
    │   ├── domainAKeys.ts
    │   ├── useDomainA.ts
    │   └── useDomainAs.ts
    ```
- Update the State Management section:
  - Replace `providers/` with `data-access-layer/` in layer responsibilities
  - Change "Providers wrap `useQuery`/`useMutation` and expose a clean context API" to "Data access hooks wrap `useQuery`/`useMutation` and expose a clean API"
  - Remove any remaining references to "context" or "Provider pattern"

---

## Sub-feature 2: Adventures

Drop `AdventureProvider` (Context wrapper), add a query key factory, convert `useAdventures` to a pure TanStack Query hook. `useAdventure` is already a standalone hook — only needs key factory adoption.

Reference implementation: `data-access-layer/npcs/`

### Provider / hooks

**New file: `adventureKeys.ts`**

```typescript
export const adventureKeys = {
  list: () => ['adventures'] as const,
  detail: (adventureId: string) => ['adventure', adventureId] as const,
};
```

**Rewrite `useAdventures.ts`** — pure TanStack Query hook (no Context):

- `useQuery` with `adventureKeys.list()`, `throwOnError: true`
- `createAdventure` mutation, invalidates `adventureKeys.list()`
- `deleteAdventure` mutation, invalidates `adventureKeys.list()`
- Return type: `{ adventures, loading, createAdventure, deleteAdventure }`

**Update `useAdventure.ts`**:

- Replace inline string keys with `adventureKeys.detail(id)` and `adventureKeys.list()`
- Add `throwOnError: true` to the `useQuery` call (currently missing — violates CLAUDE.md non-negotiable rules)
- Remove `saveError` from return type — errors propagate to Error Boundary, not local state

**Delete:**

- `AdventureProvider.tsx` (the Context wrapper)
- `AdventureContext` export

**Update `index.ts`** barrel — use explicit named exports (not `export *`) since `adventureKeys` is deliberately public API:

```typescript
export { useAdventures } from './useAdventures';
export { useAdventure } from './useAdventure';
export { adventureKeys } from './adventureKeys';
```

### Frontend

- Remove `AdventureProvider` from `DataAccessProvider.tsx`
- Update any consumer that imported `AdventureProvider` or `AdventureContext` directly

---

## Sub-feature 3: Table Config

Drop `TableConfigProvider` (Context wrapper), add a query key factory, reshape hooks so each consumer gets exactly what it needs.

Reference implementation: `data-access-layer/npcs/`

### Provider / hooks

**New file: `tableConfigKeys.ts`**

```typescript
export const tableConfigKeys = {
  all: () => ['tableConfig'] as const,
};
```

**Rewrite `useTableConfig.ts`** — pure TanStack Query hook scoped to a single table:

- Signature: `useTableConfig(tableName: string)`
- `useQuery` with `tableConfigKeys.all()`, `throwOnError: true`
- Derives the config for `tableName` internally (replaces `getConfigForTable`)
- Exposes: `{ config, loading, updateTableConfig, updateColumnWidths, updateSortState }`
- Throws if config not found for `tableName` (same behavior as current `getConfigForTable`)

**New file: `useTableConfigs.ts`** — read-only hook for settings screen:

- `useQuery` with `tableConfigKeys.all()`, `throwOnError: true`
- Read-only — no mutations. Mutations are scoped to individual tables (see below)
- Exposes: `{ tableConfigs, loading }`

**Delete:**

- `TableConfigProvider.tsx` (the Context wrapper)
- `TableConfigContext` export

**Update `index.ts`** barrel:

- Export `useTableConfig`, `useTableConfigs`, `tableConfigKeys`
- Remove `TableConfigProvider` export

### Frontend

- Remove `TableConfigProvider` from `DataAccessProvider.tsx`
- Update `SortableList`, `SortingTableHeader`, `SortableListItem`: they currently call `useTableConfig()` then `.getConfigForTable(name)` — change to `useTableConfig(tableName)` and use `config` directly
- Update `SettingsScreen`:
  - Use `useTableConfigs()` for the list (read-only)
  - Each `TableConfigRow` calls `useTableConfig(config.table_name)` internally and owns its own mutations (`updateTableConfig`). The parent does not pass `onUpdate` down — each row owns its own write surface

---

## Sub-feature 4: Images

Images currently has no service layer and calls DB functions directly from the provider. First, create a service. Then convert to TanStack Query hooks.

Reference implementation: `data-access-layer/npcs/` + `services/npcsService.ts`

### Services

**New file: `services/imageService.ts`**

- Wrap DB calls (`@db/image`) with domain logic
- Functions: `createImage(filePath)`, `deleteImage(id)`, `replaceImage(oldId, filePath)`, `getImageById(id)`, `getImageUrl(id, extension)`
- `replaceImage` composes `deleteImage` + `createImage` (follows DRY rule from CLAUDE.md)
- `getImageUrl` wraps the Tauri invoke + `convertFileSrc` call (currently in `util/imageUrl.ts`) — this is async data access, belongs in the service layer
- Throw domain errors, no try/catch (errors propagate to Error Boundary)

### Provider / hooks

**New file: `imageKeys.ts`**

```typescript
export const imageKeys = {
  detail: (imageId: string) => ['image', imageId] as const,
};
```

**New file: `useImage.ts`** — replaces the old `getImageById` + manual Map cache:

- `useQuery` with `imageKeys.detail(imageId)`, `throwOnError: true`
- The `queryFn` fetches the image record via service, then derives the URL via `imageService.getImageUrl(id, extension)` — returns the resolved URL directly
- TanStack Query cache replaces the manual `Map<string, Image>` cache
- Exposes: `{ imageUrl: string | null, loading: boolean }`

**New file: `useImageMutations.ts`** — replaces `createImage`, `deleteImage`, `replaceImage`:

- `createImage` mutation via service
- `deleteImage` mutation via service, invalidates relevant queries
- `replaceImage` mutation via service, invalidates relevant queries
- Exposes: `{ createImage, deleteImage, replaceImage }`

Note: images don't have a "list all" query — they're accessed individually by ID. The hook shape is different from NPCs/Adventures because of this. If a list query is needed in the future, add `useImages` + `imageKeys.list()` at that point.

**Delete:**

- `ImageProvider.tsx`
- `ImageContext` export
- `useImages.ts`

**Update `index.ts`** barrel:

- Export `useImage`, `useImageMutations`, `imageKeys`

**Cleanup:**

- Remove redundant `initDatabase()` call — already handled by `ensureInitialized()` in `__root.tsx` `beforeLoad`

### Frontend

- Remove `ImageProvider` from `DataAccessProvider.tsx`
- Update `ImageById` component: replace the manual `useEffect` + `useState` + `getImageById` + `getImageUrl` chain with `useImage(imageId)`. The component simplifies to reading `imageUrl` and `loading` from the hook and rendering

---

## Sub-feature 5: Sessions

Sessions currently has no service layer and uses manual `useState`/`useEffect`. Same two-step refactor as images: service first, then TanStack Query hooks.

Note: sessions is a deferred feature that needs more product thinking. This sub-feature only covers the technical migration to the target pattern. It does not change behavior or add features.

### Services

**New file: `services/sessionService.ts`**

- Wrap DB calls (`@db/session`) with domain logic
- Functions: `getAllSessions()`, `createSession(data)`, `updateSession(id, data)`, `deleteSession(id)`, `getSessionById(id)`
- Throw domain errors, no try/catch

### Provider / hooks

**New file: `sessionKeys.ts`**

```typescript
export const sessionKeys = {
  list: () => ['sessions'] as const,
  detail: (sessionId: string) => ['session', sessionId] as const,
};
```

**Rewrite `useSessions.ts`** — pure TanStack Query hook:

- `useQuery` with `sessionKeys.list()`, `throwOnError: true`
- `createSession`, `deleteSession` mutations, invalidate `sessionKeys.list()`
- Remove manual `refreshSessions` — TanStack Query invalidation replaces it
- Remove local `error` state — errors propagate to Error Boundary
- Exposes: `{ sessions, loading, createSession, deleteSession }`

**New file: `useSession.ts`** — for the upcoming detail screen:

- `useQuery` with `sessionKeys.detail(sessionId)`, `throwOnError: true`
- `updateSession` (debounced, same pattern as `useNpc`/`useAdventure`)
- `deleteSession`
- Exposes: `{ session, loading, updateSession, deleteSession }`

**Delete:**

- `SessionProvider.tsx`
- `SessionContext` export

**Update `index.ts`** barrel:

- Export `useSessions`, `useSession`, `sessionKeys`

**Cleanup:**

- Remove redundant `initDatabase()` call — already handled by `ensureInitialized()` in `__root.tsx` `beforeLoad`

### Frontend

- Remove `SessionProvider` from `DataAccessProvider.tsx`
- Update `SessionsScreen`: replace `useSessions()` call — return shape stays the same minus `error` and `refreshSessions`

---

## Sub-feature 6: Remove DataProvider

After all modules are converted, no Context providers remain. `DataAccessProvider.tsx` has no children to wrap.

### Provider / hooks

- Delete `DataAccessProvider.tsx` (formerly `DataProvider.tsx`)
- Delete `data-access-layer/index.ts` barrel

### Frontend

- In `App.tsx`: remove `<DataAccessProvider>` wrapper entirely. The component tree simplifies to:
  ```
  <ErrorBoundary>
    <TanstackQueryClientProvider>
      <main>...</main>
    </TanstackQueryClientProvider>
  </ErrorBoundary>
  ```
