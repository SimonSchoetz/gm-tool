# SF6: Frontend

Remove the temporary auto-install `useEffect` from `App.tsx`. Rework `AppVersionSection` to show a Download → progress → Restart Now flow.

## Files Affected

- `Modified:` `app/src/App.tsx` — remove `useInstallUpdate` import; remove auto-install `useEffect`; change `const { availableVersion } = useCheckUpdate()` to bare `useCheckUpdate()` call
- `Modified:` `app/src/screens/settings/components/AppVersionSection/AppVersionSection.tsx` — replace `useInstallUpdate` with `useDownloadUpdate` + `useInstallAndRelaunch`; add download progress state and Restart Now button

## Frontend Layer

### `App.tsx`

Remove the `useInstallUpdate` import from the `@/data-access-layer` import statement. Remove the `const { installUpdate } = useInstallUpdate()` line and the entire `useEffect` block (including the `// eslint-disable-next-line` comment). Change `const { availableVersion } = useCheckUpdate()` to a bare call `useCheckUpdate()` — the startup check still fires on mount; the result is consumed in `AppVersionSection`, not here.

Result: `AppContent` retains `useCheckUpdate()` as a side-effect-only call with no destructuring. The `useInstallUpdate` import is fully removed from the file.

### `AppVersionSection.tsx`

**Purpose:** Displays the current app version, allows the user to check for updates, download them, and restart when ready.

**Behavior:**

- On mount, `useCheckUpdate` has already been called in `AppContent` (startup check). `AppVersionSection` calls `useCheckUpdate` again — TanStack Query deduplicates via the shared cache.
- Four sequential states render in the update area (below the current version):
  1. **No update / checking**: "Check for Updates" button, disabled and labelled "Checking..." while `isChecking` is true.
  2. **Update available, not yet downloaded**: "Update available: {availableVersion}" text + "Download Update" button.
  3. **Downloading**: "Downloading... {downloadProgress}%" text if `downloadProgress` is not `null`; "Downloading..." text if `downloadProgress` is `null`. "Download Update" button is absent during download.
  4. **Downloaded, ready to restart**: "Restart Now" button; while `isInstalling` is true, button is disabled and labelled "Installing...".
- Errors from `checkUpdate` are exposed via `checkError` on `useCheckUpdate`. Render `checkError.message` in a `<p>` below the button when `checkError` is non-null. Errors from `downloadUpdate` and `installAndRelaunch` propagate to the Error Boundary via `throwOnError: true` on the QueryClient — no local error handling needed.

**UI / Visual:**

```tsx
import { useAppVersion, useCheckUpdate, useDownloadUpdate, useInstallAndRelaunch } from '@/data-access-layer';
import { Button } from '@/components';
import './AppVersionSection.css';

export const AppVersionSection = () => {
  const { currentVersion } = useAppVersion();
  const { availableVersion, isChecking, checkError, checkUpdate } = useCheckUpdate();
  const { downloadUpdate, isDownloading, downloadProgress, isDownloaded } = useDownloadUpdate();
  const { installAndRelaunch, isInstalling } = useInstallAndRelaunch();

  return (
    <section className='app-version-section'>
      <h2 className='app-version-section-heading'>App Version</h2>
      <p className='app-version-section-current'>{currentVersion ?? '—'}</p>
      {availableVersion && (
        <p className='app-version-section-available'>
          Update available: {availableVersion}
        </p>
      )}
      {isDownloading && (
        <p className='app-version-section-progress'>
          {downloadProgress !== null
            ? `Downloading... ${downloadProgress}%`
            : 'Downloading...'}
        </p>
      )}
      {checkError && (
        <p className='app-version-section-error'>{checkError.message}</p>
      )}
      <div className='app-version-section-actions'>
        {!isDownloading && !isDownloaded && (
          <Button
            label={isChecking ? 'Checking...' : 'Check for Updates'}
            onClick={checkUpdate}
            disabled={isChecking}
          />
        )}
        {availableVersion && !isDownloading && !isDownloaded && (
          <Button
            label='Download Update'
            onClick={() => {
              void downloadUpdate();
            }}
          />
        )}
        {isDownloaded && (
          <Button
            label={isInstalling ? 'Installing...' : 'Restart Now'}
            onClick={() => {
              void installAndRelaunch();
            }}
            disabled={isInstalling}
          />
        )}
      </div>
    </section>
  );
};
```

**CSS additions to `AppVersionSection.css`:**

Add two new class rules. All values must reference tokens from `styles/variables/`:

```css
.app-version-section-progress {
  color: var(--color-primary);
}

.app-version-section-error {
  color: var(--color-primary);
}
```

The color token for these two new classes matches the existing `.app-version-section-current` and `.app-version-section-available` rules — use the same `var(--color-primary)` value. If a semantic error color token exists in `styles/variables/color-variables.css`, use it for `.app-version-section-error` instead. Verify before adding.
