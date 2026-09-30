# Sub-feature 3: Pinned-popups context split

Moves the pinned-popups context, its value types and `usePinnedPopups` into a new module, `src/providers/PinnedPopupsContext/`. `MentionBadge` then reads the context without importing the provider that renders `MentionPopup`, which removes the one import cycle left after the barrels go (root Key Architectural Decisions — "The pinned-popups context and hook become their own module"). The same pass turns every provider import that reaches into another `src/` folder with a relative path into an `@/` import (root Key Architectural Decisions — "Import specifier form").

## Files affected

Moved:

- `mv app/src/providers/PinnedPopupsProvider/PinnedPopupsContext.ts app/src/providers/PinnedPopupsContext/PinnedPopupsContext.ts`, then change its type import `from '../../components/MentionPopup'` to `from '@/components/MentionPopup'`.
- `mv app/src/providers/PinnedPopupsProvider/usePinnedPopups.ts app/src/providers/PinnedPopupsContext/usePinnedPopups.ts` — no content change; its `'./PinnedPopupsContext'` import still resolves.

New:

- `app/src/providers/PinnedPopupsContext/index.ts` — explicit named exports:
  - `export { PinnedPopupsContext } from './PinnedPopupsContext';`
  - `export { usePinnedPopups } from './usePinnedPopups';`
  - `export type { PinnedPopupsContextValue, ShowPopupArgs } from './PinnedPopupsContext';`

Modified:

- `app/src/providers/PinnedPopupsProvider/PinnedPopupsProvider.tsx`:
  - The import of `PinnedPopupsContext`, `ShowPopupArgs` and `PinnedPopupsContextValue` changes from `'./PinnedPopupsContext'` to `'../PinnedPopupsContext'`.
  - Both `'../../components/MentionPopup'` imports (the value `MentionPopup` and the types `PopupPosition`, `PopupPlacement`) change to `'@/components/MentionPopup'`.
- `app/src/providers/AppProviders/AppProviders.tsx` — `import { PinnedPopupsProvider } from '../PinnedPopupsProvider'` becomes `from '../PinnedPopupsProvider/PinnedPopupsProvider'`.
- `app/src/providers/index.ts`:
  - Line 3 becomes `export { PinnedPopupsProvider } from './PinnedPopupsProvider/PinnedPopupsProvider';`.
  - Line 4 (`export type { ShowPopupArgs } …`) is deleted: after this sub-feature, no file outside `providers/` imports `ShowPopupArgs` or `usePinnedPopups` through this barrel [spec-writer_24: `grep -rn "PinnedPopups" app/src` outside `providers/PinnedPopupsProvider/` — found only `AppProviders.tsx` (`PinnedPopupsProvider`) and `MentionBadge.tsx` (`usePinnedPopups`)]. SF5 deletes this file.
- `app/src/components/TextEditor/components/MentionBadge/MentionBadge.tsx` — `import { usePinnedPopups } from '@/providers'` becomes `from '@/providers/PinnedPopupsContext'`.
- `app/src/providers/DeleteDialogProvider/DeleteDialogContext.ts` — `'../../components/DeleteDialog/DeleteDialog'` becomes `'@/components/DeleteDialog/DeleteDialog'`.
- `app/src/providers/DeleteDialogProvider/DeleteDialogProvider.tsx` — `'../../components/PopUpContainer/PopUpContainer'` becomes `'@/components/PopUpContainer/PopUpContainer'` (still a default import), and `'../../components/DeleteDialog/DeleteDialog'` becomes `'@/components/DeleteDialog/DeleteDialog'`.

Deleted:

- `app/src/providers/PinnedPopupsProvider/index.ts` — after the move, the folder holds only `PinnedPopupsProvider.tsx` and its stylesheet, so the `index.ts` hides nothing.

Draft: none.

## Layered breakdown

### Frontend

`src/providers/PinnedPopupsContext/` is a module folder with internals (two source files), so it gets an `index.ts` (root Key Architectural Decisions — "A folder has an `index.ts` exactly when it hides something"). It contains no provider component. It sits in `providers/` because it is the provider's context, and `MentionBadge` and `PinnedPopupsProvider` are its only importers.

`PinnedPopupsProvider/` keeps only `PinnedPopupsProvider.tsx` and `PinnedPopupsProvider.css`. With one source file and its stylesheet, it hides nothing, so its `index.ts` is deleted and its two importers name the file directly.

`DeleteDialogProvider/` keeps its context, provider and hook together. None of its consumers closes a cycle, so the split above has no reason to apply to it.

Until SF5 deletes `src/components/index.ts`, the new `@/components/<Module>/<File>` specifiers cross the `src/components` boundary. The resulting `local/no-import-past-index` warnings are expected and disappear in SF5.

## Tests

No behavior changes. No test file imports `usePinnedPopups`, `PinnedPopupsContext` or `PinnedPopupsProvider` [spec-writer_24].

## Verification

`import-x/no-cycle` no longer reports a cycle involving `MentionBadge.tsx` or `PinnedPopupsProvider.tsx` (other cycles through barrels remain until SF4 and SF5).
