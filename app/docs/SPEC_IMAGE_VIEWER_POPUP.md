# Image Viewer Popup

## Progress Tracker

- SF1: ImageViewerDialog — create the popup content component with header (entity name + icon actions) and image display area
- SF2: UploadImgBtn refactor [FOUNDATION] — add required `deleteFn` prop, change image-present click to open popup, render via `createPortal`, create module barrel
- SF3: Call site updates — add `deleteFn` and `title` to NpcScreen and AdventureScreen

## Key Architectural Decisions

### Local state, no provider

The popup is triggered exclusively from `UploadImgBtn`. No other component needs to open the image viewer imperatively. Popup open/closed state lives as local `useState` in `UploadImgBtn`. The `DeleteDialogProvider` pattern (context + hook) applies when a dialog must be reachable from arbitrary positions in the component tree; that condition does not hold here.

### `ImageViewerDialog` as sub-component of `UploadImgBtn`

CLAUDE.md: sub-components used exclusively within a parent belong in `ComponentName/components/`. `ImageViewerDialog` is rendered only by `UploadImgBtn`. Placement: `UploadImgBtn/components/ImageViewerDialog/`. `UploadImgBtn/components/index.ts` is the required grouping barrel (explicit named exports; `export *` banned).

### `deleteFn` is a required prop

The popup always shows a delete action when an image is present. Making `deleteFn: () => void` required forces callers to wire it correctly. All current callers (NpcScreen, AdventureScreen) support image deletion.

### Callers own the delete composition

`UploadImgBtn` knows nothing about which entity owns the image. Each caller composes `useImageMutations().deleteImage(image_id)` (removes the image file from the image DB table) and `updateNpc/updateAdventure({ image_id: null })` (clears the entity's reference). Both operations are independent and fire concurrently.

### `createPortal` to `document.body`

`UploadImgBtn` renders the popup overlay via `createPortal` to `document.body`, identical to the `DeleteDialogProvider` pattern. This guarantees the overlay stacks above all other content regardless of CSS stacking context.

### Delete uses the existing `DeleteDialogProvider`

`ImageViewerDialog` calls `useDeleteDialog()` to open a `DeleteDialog` with `oneClickConfirm: true`. This produces overlay-over-overlay (image viewer behind, delete confirmation on top). `onDeletionConfirm` calls `deleteFn()` then `onClose()` — in that order, so the entity reference clears before the popup closes.

### CSS sizing — pure flex, no JS measurement

`.image-viewer-dialog` uses `display: flex; flex-direction: column; max-width: 90vw; max-height: 90vh; overflow: hidden`. The image container uses `flex: 1; min-height: 0` to fill remaining height after the header. The image uses `max-width: 100%; max-height: 100%; width: auto; height: auto` — capped by its container, never upscaled, always ratio-preserving. `popup-content` in `PopUpContainer.css` already enforces `max-width: 90vw; max-height: 90vh` as a second guard, but `.image-viewer-dialog` is self-contained and does not rely on it.

---

## SF1: ImageViewerDialog

Create the popup content component. This is the inner panel that sits inside `PopUpContainer`; it is not aware of the overlay.

### Files Affected

**New:**
- `app/src/components/UploadImgBtn/components/ImageViewerDialog/ImageViewerDialog.tsx`
- `app/src/components/UploadImgBtn/components/ImageViewerDialog/ImageViewerDialog.css`
- `app/src/components/UploadImgBtn/components/index.ts`

### Frontend

**Purpose:** Renders a `GlassPanel` with a header row (entity name + three icon actions) and an image display area. Wires the delete action through `useDeleteDialog`, the replace action through `filePicker` + `uploadFn`, and the close action through `onClose`.

**Behavior:**
- Delete icon: calls `openDeleteDialog({ name: '<title> image', onDeletionConfirm: () => { deleteFn(); onClose(); }, oneClickConfirm: true })`. `onDeletionConfirm` fires `deleteFn()` before `onClose()`.
- Replace icon: defines `const handleReplaceClick = async () => { const filePath = await filePicker('image'); if (filePath !== null) { uploadFn(filePath); onClose(); } }`. The onClick is `() => { void handleReplaceClick(); }`. When the user cancels the file picker (`filePath === null`), neither `uploadFn` nor `onClose` are called.
- Close icon: `onClick={onClose}` — passed directly, no wrapper.
- `ImageById` handles its own loading and not-found states internally; `ImageViewerDialog` adds no loading or error UI.

**UI / Visual:**

Props (case 3 — closed API, `FCProps<Props>`):
```ts
type Props = {
  image_id: string;
  title: string;
  onClose: () => void;
  uploadFn: (filePath: string) => void;
  deleteFn: () => void;
};
```

DOM structure:
```
GlassPanel[className="image-viewer-dialog"]
├── div[className="image-viewer-dialog-header"]
│   ├── span[className="image-viewer-dialog-title"] — {title}
│   ├── ClickableIcon[icon=<Trash2Icon />, variant="danger", label="Delete image", title="Delete image"]
│   ├── ClickableIcon[icon=<UploadIcon />, label="Replace image", title="Replace image"]
│   └── ClickableIcon[icon=<XIcon />, label="Close", title="Close"]
└── div[className="image-viewer-dialog-content"]
    └── ImageById[imageId={image_id}, className="image-viewer-dialog-img", alt={`${title} image`}]
```

All imports are relative paths — importing from `@/components` would create a circular dependency through the grouping barrel that exports `UploadImgBtn`:
- `import GlassPanel from '../../GlassPanel/GlassPanel'` — default export, no barrel exists for `GlassPanel/`
- `import { ClickableIcon } from '../../ClickableIcon'` — barrel exists at `ClickableIcon/index.ts`
- `import { ImageById } from '../../ImageById/ImageById'` — no barrel exists for `ImageById/`
- `import { useDeleteDialog } from '@/providers'` — path alias, no circular dependency
- `import { filePicker } from '@/util'` — path alias, no circular dependency
- `import { FCProps } from '@/types'` — path alias, no circular dependency
- `import { Trash2Icon, UploadIcon, XIcon } from 'lucide-react'` — external package

CSS — `ImageViewerDialog.css`:
```css
.image-viewer-dialog {
  display: flex;
  flex-direction: column;
  max-width: 90vw;
  max-height: 90vh;
  overflow: hidden;
}

.image-viewer-dialog-header {
  display: flex;
  align-items: center;
  gap: var(--spacing-md);
  padding: var(--spacing-md);
}

.image-viewer-dialog-title {
  flex: 1;
}

.image-viewer-dialog-content {
  flex: 1;
  min-height: 0;
  overflow: hidden;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: var(--spacing-md);
}

.image-viewer-dialog-img {
  max-width: 100%;
  max-height: 100%;
  width: auto;
  height: auto;
  display: block;
}
```

`UploadImgBtn/components/index.ts` (grouping barrel — explicit named exports, never `export *`):
```ts
export { ImageViewerDialog } from './ImageViewerDialog/ImageViewerDialog';
```

---

## SF2: UploadImgBtn refactor [FOUNDATION: SF3 depends on this]

[FOUNDATION: SF3 depends on this] Adding `deleteFn` as a required prop breaks both callers until SF3 updates them. Do not run baseline checks after this SF alone — run only after SF3 is complete.

### Files Affected

**New:**
- `app/src/components/UploadImgBtn/index.ts`

**Modified:**
- `app/src/components/UploadImgBtn/UploadImgBtn.tsx`
- `app/src/components/index.ts`

### Frontend

**Purpose:** `UploadImgBtn` gains `deleteFn`, local popup state, and a portal render. The no-image path (placeholder frame + file picker on click) is unchanged. The image-present path changes from opening the file picker directly to opening `ImageViewerDialog` in a `PopUpContainer` portal.

**Behavior:**
- Image-present path: clicking `ActionContainer` sets `popupState` to `'open'`. `PopUpContainer` (with `state={popupState}` and `setState={setPopupState}`) renders `ImageViewerDialog` via `createPortal` to `document.body`. Pressing Escape or clicking the backdrop is handled by `PopUpContainer` internally (sets state to `'closed'`). `onClose` passed to `ImageViewerDialog` is `() => { setPopupState('closed'); }`.
- No-image path: unchanged.

**UI / Visual:**

Updated `Props` in `UploadImgBtn.tsx` — add `deleteFn`:
```ts
type Props = {
  image_id?: string | null;
  title?: string;
  dimensions?: React.ComponentProps<typeof ImagePlaceholderFrame>['dimensions'];
  uploadFn: (filePath: string) => void;
  deleteFn: () => void;
};
```

New imports to add to `UploadImgBtn.tsx`:
```ts
import { createPortal } from 'react-dom';
import PopUpContainer from '../PopUpContainer/PopUpContainer';
import { ImageViewerDialog } from './components';
```

`PopUpContainer` has no barrel (`index.ts` does not exist in `PopUpContainer/`), so import from the file directly. `ImageViewerDialog` is imported from the sub-component grouping barrel `'./components'`.

Add local state to the component body:
```ts
const [popupState, setPopupState] = useState<'open' | 'closed'>('closed');
```

Replace the image-present render path. The current `label='Replace cover image'` is removed; the new `ActionContainer` opens the popup:
```tsx
return image_id ? (
  <>
    <ActionContainer
      onClick={() => { setPopupState('open'); }}
      label='View image'
    >
      <HoloImg image_id={image_id} title={title} dimensions={dimensions} />
    </ActionContainer>
    {createPortal(
      <PopUpContainer state={popupState} setState={setPopupState}>
        <ImageViewerDialog
          image_id={image_id}
          title={title}
          onClose={() => { setPopupState('closed'); }}
          uploadFn={uploadFn}
          deleteFn={deleteFn}
        />
      </PopUpContainer>,
      document.body,
    )}
  </>
) : (
  /* existing no-image path — no changes */
)
```

The truthy check on `image_id` (typed `string | null | undefined`) narrows it to `string` in the truthy branch, satisfying `ImageViewerDialog`'s `image_id: string` prop.

**Cleanup:** Remove `label='Replace cover image'` — replaced by `label='View image'` above.

`UploadImgBtn/index.ts` (module barrel — required for module directories; single public concern; explicit named export):
```ts
export { UploadImgBtn } from './UploadImgBtn';
```

`components/index.ts` — update the `UploadImgBtn` entry to use the module barrel (the double-name form is invalid once a barrel exists):
```ts
// Before:
export { UploadImgBtn } from './UploadImgBtn/UploadImgBtn.tsx';
// After:
export { UploadImgBtn } from './UploadImgBtn';
```

---

## SF3: Call site updates

Update `NpcScreen` and `AdventureScreen` to pass the now-required `deleteFn` prop and the new `title` prop to `UploadImgBtn`.

### Files Affected

**Modified:**
- `app/src/screens/npc/NpcScreen.tsx`
- `app/src/screens/adventure/AdventureScreen.tsx`

### Frontend

**NpcScreen — changes:**

Add `useImageMutations` to the `@/data-access-layer` import. Pass `title` and `deleteFn` to `UploadImgBtn`. The `deleteFn` guard (`if (npc.image_id)`) is required because `npc.image_id` is `string | null | undefined` and `deleteImage` requires `string`.

```tsx
const { deleteImage } = useImageMutations();

<UploadImgBtn
  dimensions={{ width: '200px', height: '200px' }}
  image_id={npc.image_id ?? null}
  title={npc.name}
  uploadFn={(filePath) => {
    updateNpc({ imgFilePath: filePath, image_id: npc.image_id });
  }}
  deleteFn={() => {
    if (npc.image_id) {
      void deleteImage(npc.image_id);
      updateNpc({ image_id: null });
    }
  }}
/>
```

**AdventureScreen — changes:**

Add `useImageMutations` to the `@/data-access-layer` import. Pass `title` and `deleteFn` to `UploadImgBtn`.

```tsx
const { deleteImage } = useImageMutations();

<UploadImgBtn
  image_id={adventure.image_id ?? null}
  title={adventure.name}
  uploadFn={(filePath) => {
    updateAdventure({ imgFilePath: filePath, image_id: adventure.image_id });
  }}
  deleteFn={() => {
    if (adventure.image_id) {
      void deleteImage(adventure.image_id);
      updateAdventure({ image_id: null });
    }
  }}
/>
```

---

## CLAUDE.md Impact

None. The spec follows existing conventions throughout: sub-component placement in `ComponentName/components/`, module barrel at `UploadImgBtn/index.ts`, grouping barrel at `UploadImgBtn/components/index.ts` with explicit named exports, `createPortal` pattern consistent with `DeleteDialogProvider`.
