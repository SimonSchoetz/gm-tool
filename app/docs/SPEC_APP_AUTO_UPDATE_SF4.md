# SF4: Settings Screen Restructuring

Extracts the existing table-config content into `<TableConfigSection />` and adds
`<AppVersionSection />`. Each section has its own heading. `SettingsScreen` becomes a thin shell.

## Files Affected

```
New:
  src/screens/settings/components/TableConfigSection/TableConfigSection.tsx
  src/screens/settings/components/TableConfigSection/TableConfigSection.css
  src/screens/settings/components/AppVersionSection/AppVersionSection.tsx
  src/screens/settings/components/AppVersionSection/AppVersionSection.css

Modified:
  src/screens/settings/components/index.ts
  src/screens/settings/SettingsScreen.tsx
  src/screens/settings/SettingsScreen.css
```

## Frontend Layer

### `src/screens/settings/components/TableConfigSection/TableConfigSection.tsx`

**Purpose:** Owns the table configuration list that previously lived in `SettingsScreen`. Extracts
the `useTableConfigs` hook call, the loading state, the section heading, and the list rendering
out of the parent screen.

**Behavior:** Reads `tableConfigs` and `loading` from `useTableConfigs`. Renders `null` (or a
loading indicator consistent with any existing loading pattern in the codebase) while loading.
Renders the list of `<TableConfigRow />` entries when loaded.

**UI / Visual:**
- Root element: `<section className='table-config-section'>`
- Heading: `<h2 className='table-config-section-heading'>Table Configuration</h2>`
- Scroll area and list: move the existing `<CustomScrollArea>` + `<ul>` structure from
  `SettingsScreen` into this component unchanged
- The CSS class on the `<ul>` must be renamed from `.settings-config-list` to
  `.table-config-section-list` (block name change on extraction — per CLAUDE.md CSS rule)

Zero external props — this component is self-contained. Apply the zero-props exception:
do not write `FCProps<Props>` with an empty Props body.

```tsx
import { useTableConfigs } from '@/data-access-layer';
import { CustomScrollArea } from '@/components';
import { TableConfigRow } from '../components';
import './TableConfigSection.css';

export const TableConfigSection = () => {
  const { tableConfigs, loading } = useTableConfigs();

  if (loading) {
    return <div className='content-center'>Loading...</div>;
  }

  return (
    <section className='table-config-section'>
      <h2 className='table-config-section-heading'>Table Configuration</h2>
      <CustomScrollArea>
        <ul className='table-config-section-list'>
          {tableConfigs.map((config) => (
            <TableConfigRow key={config.id} tableConfigId={config.id} />
          ))}
        </ul>
      </CustomScrollArea>
    </section>
  );
};
```

Note: `TableConfigRow` is imported from `'../components'` (the grouping barrel), not by direct path.

### `src/screens/settings/components/TableConfigSection/TableConfigSection.css`

Move the `.settings-config-list` rule from `SettingsScreen.css` and rename to the new block:

```css
.table-config-section-heading {
  font-size: var(--font-size-xl);
  font-weight: var(--font-weight-bold);
  color: var(--color-primary);
}

.table-config-section-list {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-sm);
  padding: var(--spacing-xs);
}
```

### `src/screens/settings/components/AppVersionSection/AppVersionSection.tsx`

**Purpose:** Displays the current app version and exposes update checking and installation to the
user.

**Behavior:**
- Reads `currentVersion` from `useAppVersion()`
- Reads `availableVersion`, `isChecking`, and `checkUpdate` from `useCheckUpdate()`
- Reads `installUpdate` and `isInstalling` from `useInstallUpdate()`
- On mount the check result is already cached from the App.tsx auto-check; no extra call needed
- "Check for Updates" button calls `checkUpdate()` — disabled while `isChecking`
- When `availableVersion` is non-null, display the version and show an "Install Update" button
- "Install Update" button calls `void installUpdate()` — disabled while `isInstalling`
- After install the app restarts automatically; no success state is rendered

**UI / Visual:**
- Root element: `<section className='app-version-section'>`
- Heading: `<h2 className='app-version-section-heading'>App Version</h2>`
- Current version display: `<p>` or `<span>` showing `currentVersion ?? '—'`
- Buttons: use the shared `Button` component from `@/components` for both actions
- Exact visual treatment (layout, spacing, update-available message phrasing) is deferred —
  use sensible defaults and shared components; the user will refine in a later pass

Zero external props — apply the zero-props exception.

```tsx
import { useAppVersion, useCheckUpdate, useInstallUpdate } from '@/data-access-layer';
import { Button } from '@/components';
import './AppVersionSection.css';

export const AppVersionSection = () => {
  const { currentVersion } = useAppVersion();
  const { availableVersion, isChecking, checkUpdate } = useCheckUpdate();
  const { installUpdate, isInstalling } = useInstallUpdate();

  return (
    <section className='app-version-section'>
      <h2 className='app-version-section-heading'>App Version</h2>
      <p className='app-version-section-current'>{currentVersion ?? '—'}</p>
      {availableVersion && (
        <p className='app-version-section-available'>
          Update available: {availableVersion}
        </p>
      )}
      <div className='app-version-section-actions'>
        <Button onClick={checkUpdate} disabled={isChecking}>
          {isChecking ? 'Checking...' : 'Check for Updates'}
        </Button>
        {availableVersion && (
          <Button
            onClick={() => { void installUpdate(); }}
            disabled={isInstalling}
          >
            {isInstalling ? 'Installing...' : 'Install Update'}
          </Button>
        )}
      </div>
    </section>
  );
};
```

The `installUpdate` call uses `() => { void installUpdate(); }` — required by
`@typescript-eslint/no-misused-promises` since `installUpdate` returns `Promise<void>` and
`onClick` expects a synchronous handler.

Before writing this component, verify the `Button` component's prop signature from
`src/components/Button/Button.tsx` — confirm `onClick` and `disabled` prop names match.

### `src/screens/settings/components/AppVersionSection/AppVersionSection.css`

```css
.app-version-section-heading {
  font-size: var(--font-size-xl);
  font-weight: var(--font-weight-bold);
  color: var(--color-primary);
}

.app-version-section-current {
  color: var(--color-primary);
}

.app-version-section-available {
  color: var(--color-primary);
}

.app-version-section-actions {
  display: flex;
  gap: var(--spacing-sm);
}
```

Exact styling is deferred. These rules establish the block namespace and use valid design tokens.
The user will refine visuals in a later pass.

### `src/screens/settings/components/index.ts`

Add the two new exports. The existing `TableConfigRow` export stays unchanged.

```ts
export { TableConfigRow } from './TableConfigRow/TableConfigRow';
export { TableConfigSection } from './TableConfigSection/TableConfigSection';
export { AppVersionSection } from './AppVersionSection/AppVersionSection';
```

### `src/screens/settings/SettingsScreen.tsx`

Replace the current body with the two sub-components. The `useTableConfigs` hook call moves into
`TableConfigSection` — remove it from here.

```tsx
import { GlassPanel } from '@/components';
import { TableConfigSection, AppVersionSection } from './components';
import './SettingsScreen.css';

export const SettingsScreen = () => (
  <GlassPanel className='settings-screen'>
    <TableConfigSection />
    <AppVersionSection />
  </GlassPanel>
);
```

### `src/screens/settings/SettingsScreen.css`

Remove `.settings-heading` (moved to sub-component CSS files, renamed) and
`.settings-config-list` (moved to `TableConfigSection.css`, renamed). Retain `.settings-screen`.

```css
.settings-screen {
  display: flex;
  flex-direction: column;
  position: relative;
  height: 100%;
  padding: var(--spacing-md);
  gap: var(--spacing-lg);
}
```
