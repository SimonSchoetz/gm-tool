# SPEC: AppProviders Consolidation

## Progress Tracker

- Sub-feature 1: AppProviders component — new module in `providers/` that bundles all context providers
- Sub-feature 2: App.tsx update — replace individual provider wrappers with AppProviders

---

## Key Architectural Decisions

**AppProviders wraps context providers only — not ErrorBoundary or TanstackQueryClientProvider.**
`ErrorBoundary` stays in `components/` and remains in `App.tsx`. `TanstackQueryClientProvider` stays in `data-access-layer/` and remains in `App.tsx`. `AppProviders` bundles only the React Context providers from `providers/`. The resulting App.tsx nesting order is: `<ErrorBoundary><TanstackQueryClientProvider><AppProviders>`.

**DeleteDialogProvider moves inside TanstackQueryClientProvider.**
Its current placement outside ErrorBoundary in App.tsx was accidental — the provider has no dependency that requires it to render before the error boundary. Moving it inside AppProviders places it correctly inside both ErrorBoundary and TanstackQueryClientProvider.

**Inner nesting order: DeleteDialogProvider wraps PinnedPopupsProvider.**
DeleteDialogProvider has no TanStack Query or other provider dependency. PinnedPopupsProvider renders MentionPopup which uses TanStack Query — it goes innermost to keep its consumers closest to the data layer. Order: `<DeleteDialogProvider><PinnedPopupsProvider>{children}</PinnedPopupsProvider></DeleteDialogProvider>`.

---

## Sub-feature 1: AppProviders Component

New module in `providers/` that bundles all context providers into a single wrapper.

**Files affected**

- New: `app/src/providers/AppProviders/AppProviders.tsx`
- New: `app/src/providers/AppProviders/index.ts`
- Modified: `app/src/providers/index.ts`

**Frontend**

**Purpose:** Consolidate all app-level context providers into a single entry point so that App.tsx does not accumulate provider wrappers as new providers are added.

**Behavior:** Wraps children in `DeleteDialogProvider` (outer) then `PinnedPopupsProvider` (inner). No state owned by AppProviders itself — it is a pure composition component.

**UI / Visual:** No visual output. Transparent wrapper.

```tsx
// AppProviders.tsx
import { ReactNode } from 'react';
import { FCProps } from '@/types';
import { DeleteDialogProvider } from '../DeleteDialogProvider';
import { PinnedPopupsProvider } from '../PinnedPopupsProvider';

type Props = { children: ReactNode };

export const AppProviders: FCProps<Props> = ({ children }) => (
  <DeleteDialogProvider>
    <PinnedPopupsProvider>{children}</PinnedPopupsProvider>
  </DeleteDialogProvider>
);
```

**Barrel — `providers/AppProviders/index.ts`** (new module directory barrel, required):

```ts
export { AppProviders } from './AppProviders';
```

**Barrel — `providers/index.ts`** (grouping barrel, explicit named exports only):

Add: `export { AppProviders } from './AppProviders';`

Verified current barrel uses explicit named exports — convention is satisfied. Full barrel after change:

```ts
export { AppProviders } from './AppProviders';
export { DeleteDialogProvider, useDeleteDialog } from './DeleteDialogProvider';
export { PinnedPopupsProvider, usePinnedPopups } from './PinnedPopupsProvider';
export type { PinPopupArgs } from './PinnedPopupsProvider';
```

---

## Sub-feature 2: App.tsx Update

Replace the individual provider wrappers in App.tsx with a single `<AppProviders>` element.

**Files affected**

- Modified: `app/src/App.tsx`

**Frontend**

**Purpose:** App.tsx becomes responsible only for the visual shell layout — providers are fully delegated to `AppProviders`.

**Behavior:** No behavioral change. Provider nesting order is preserved. The inner `<ErrorBoundary>` wrapping the `<Outlet>` Suspense boundary is not affected.

**UI / Visual:** No visual change.

Target structure:

```tsx
import { AppProviders } from '@/providers';
// ErrorBoundary, TanstackQueryClientProvider remain imported as before

export const App = () => (
  <ErrorBoundary>
    <TanstackQueryClientProvider>
      <AppProviders>
        <Backdrop />
        <LightSource intensity='bright' />
        <main className='app'>
          <SideBarNav />
          <div className='screens-container'>
            <Header />
            <ErrorBoundary>
              <Suspense fallback={<GlassPanel>Loading...</GlassPanel>}>
                <Outlet />
              </Suspense>
            </ErrorBoundary>
          </div>
        </main>
      </AppProviders>
    </TanstackQueryClientProvider>
  </ErrorBoundary>
);
```

Remove imports: `DeleteDialogProvider`, `PinnedPopupsProvider` (no longer used directly in App.tsx).
Add import: `AppProviders` from `@/providers`.

---

## CLAUDE.md Impact

None. No new structural pattern is introduced. `providers/` already has a documented grouping barrel convention. No files, paths, or modules are renamed or removed that are referenced in CLAUDE.md.
