# SF3: Domain Errors + Types

[FOUNDATION: SF4, SF5, SF6 depend on this. Do not commit SF3 alone — run baseline checks only after SF3+SF4+SF5+SF6 are all complete. Stage as unit: `app/domain/updater/errors.ts`, `app/domain/updater/types.ts`, `app/domain/updater/index.ts`, `app/domain/index.ts`, `app/services/updaterService.ts`, `app/src/data-access-layer/updater/useDownloadUpdate.ts`, `app/src/data-access-layer/updater/useInstallAndRelaunch.ts`, `app/src/data-access-layer/updater/index.ts`, `app/src/data-access-layer/index.ts`, `app/src/App.tsx`, `app/src/screens/settings/components/AppVersionSection/AppVersionSection.tsx`. Deleted files (stage deletion): `app/src/data-access-layer/updater/useInstallUpdate.ts`.]

Remove `UpdateInstallError` / `updateInstallError`. Add `UpdateDownloadError`, `UpdateInstallAndRelaunchError`, and `DownloadProgressEvent` type.

## Files Affected

- `Modified:` `app/domain/updater/errors.ts` — remove `UpdateInstallError` + `updateInstallError`; add `UpdateDownloadError` + `updateDownloadError` + `UpdateInstallAndRelaunchError` + `updateInstallAndRelaunchError`
- `New:` `app/domain/updater/types.ts`
- `Modified:` `app/domain/updater/index.ts` — remove old exports; add new exports
- `Modified:` `app/domain/index.ts` — remove `UpdateInstallError` / `updateInstallError` from re-exports; add new symbols

## Domain Layer

### `domain/updater/errors.ts`

Remove the `UpdateInstallError` type and `updateInstallError` factory. Replace with:

```ts
export type UpdateDownloadError = Error & { name: 'UpdateDownloadError' };
export const updateDownloadError = (cause?: unknown): UpdateDownloadError => {
  const error = new Error(
    `Failed to download update: ${String(cause)}`,
  ) as UpdateDownloadError;
  error.name = 'UpdateDownloadError';
  return error;
};

export type UpdateInstallAndRelaunchError = Error & {
  name: 'UpdateInstallAndRelaunchError';
};
export const updateInstallAndRelaunchError = (
  cause?: unknown,
): UpdateInstallAndRelaunchError => {
  const error = new Error(
    `Failed to install update: ${String(cause)}`,
  ) as UpdateInstallAndRelaunchError;
  error.name = 'UpdateInstallAndRelaunchError';
  return error;
};
```

Keep `UpdateCheckError`, `UpdateCheckErrorReason`, and `updateCheckError` unchanged.

### `domain/updater/types.ts` (new)

```ts
export type DownloadProgressEvent = {
  event: 'progress';
  data: { chunkLength: number; contentLength: number | null };
};
```

Mirrors the Rust `DownloadEvent::Progress { chunk_length, content_length }` variant serialized with `#[serde(rename_all = "camelCase", tag = "event", content = "data")]`. `Option<u64>` serializes as `null` when `None`.

### `domain/updater/index.ts`

```ts
export type {
  UpdateCheckError,
  UpdateCheckErrorReason,
  UpdateDownloadError,
  UpdateInstallAndRelaunchError,
} from './errors';
export {
  updateCheckError,
  updateDownloadError,
  updateInstallAndRelaunchError,
} from './errors';
export type { DownloadProgressEvent } from './types';
```

### `domain/index.ts`

Remove:
```ts
export type { ..., UpdateInstallError } from './updater';
export { ..., updateInstallError } from './updater';
```

Add `UpdateDownloadError`, `updateDownloadError`, `UpdateInstallAndRelaunchError`, `updateInstallAndRelaunchError`, and `DownloadProgressEvent` to the existing updater re-export lines. Keep all other domain exports unchanged.
