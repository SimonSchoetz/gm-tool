# SF5 — ImageViewerDialog: Header Extraction, Dimensions Prop, Mode Toggle

Extract `ImageViewerDialogHeader` as a sub-component. Add `dimensions` prop to `ImageViewerDialog`. Add `mode` state that toggles between `'view'` and `'framing'` via the settings-2 icon. Move scoped CSS to the new sub-component file.

This SF leaves `{mode === 'framing' && null}` as a placeholder in `ImageViewerDialog` — SF6 replaces `null` with `<FramingOverlay />`.

## Files Affected

New:
- `app/src/components/UploadImgBtn/components/ImageViewerDialog/components/index.ts`
- `app/src/components/UploadImgBtn/components/ImageViewerDialog/components/ImageViewerDialogHeader.tsx`
- `app/src/components/UploadImgBtn/components/ImageViewerDialog/components/ImageViewerDialogHeader.css`

Modified:
- `app/src/components/UploadImgBtn/components/ImageViewerDialog/ImageViewerDialog.tsx`
- `app/src/components/UploadImgBtn/components/ImageViewerDialog/ImageViewerDialog.css`
- `app/src/components/UploadImgBtn/UploadImgBtn.tsx`

## Frontend

### Purpose

Restructures `ImageViewerDialog` to support a second content mode (framing). The header becomes a self-contained sub-component. The settings-2 icon is the entry point for framing mode.

---

### `ImageViewerDialogHeader` — new sub-component

**File:** `app/src/components/UploadImgBtn/components/ImageViewerDialog/components/ImageViewerDialogHeader.tsx`

**Props type** (case 3 — closed API, `FCProps<Props>`):

```ts
type Props = {
  title: string;
  onDeleteClick: () => void;
  onReplaceClick: () => void;
  onSettingsClick: () => void;
  onClose: () => void;
};
```

**Behavior:**

- Contains a `useRef<HTMLDivElement>(null)` and a `useLayoutEffect` (moved verbatim from `ImageViewerDialog`). The `useLayoutEffect` measures the header's `offsetHeight` and sets `--rt-image-viewer-dialog-header-h` on `header.parentElement`. The existing inline comment is preserved: *"Measures header height so the image can derive its own max-height via calc() without needing a definite parent height — which max-height alone cannot establish for CSS percentage resolution."*
- Renders five children in order: `<span>` for title, `Trash2Icon` clickable icon (danger variant, `onDeleteClick`), `UploadIcon` clickable icon (`onReplaceClick`), `Settings2Icon` clickable icon (`onSettingsClick`), `XIcon` clickable icon (`onClose`).
- `Settings2Icon` is imported from `lucide-react` (verified export: `Settings2Icon`). No toggle styling applied to the icon — the icon looks the same in both modes.

**UI:**

- Root element: `<div ref={headerRef} className='image-viewer-dialog-header'>`.
- All existing icon labels and titles are preserved from `ImageViewerDialog`'s current header.
- `Settings2Icon` icon: `label='Toggle framing'`, `title='Toggle framing'`.

**Imports inside `ImageViewerDialogHeader.tsx`:**

- `{ useLayoutEffect, useRef }` from `'react'`
- `{ Trash2Icon, UploadIcon, Settings2Icon, XIcon }` from `'lucide-react'`
- `{ FCProps }` from `'@/types'`
- `{ useDeleteDialog }` — NOT imported here; delete logic stays in `ImageViewerDialog`
- `{ ClickableIcon }` from `'../../ClickableIcon'` — resolves to `UploadImgBtn/components/ClickableIcon` (sibling import via relative path; must not use `@/components` to avoid circular dependency)

Wait — `ClickableIcon` is at `app/src/components/ClickableIcon/`. From `ImageViewerDialogHeader.tsx` at `app/src/components/UploadImgBtn/components/ImageViewerDialog/components/ImageViewerDialogHeader.tsx`, the relative path to `ClickableIcon` is `'../../../../ClickableIcon/ClickableIcon'`. Verify: 4 levels up from `components/` gives `src/components/`. Then `ClickableIcon/ClickableIcon`. Check if `ClickableIcon/` has an `index.ts` barrel.

**Import path for `ClickableIcon`:** `'../../../../ClickableIcon'` — `app/src/components/ClickableIcon/index.ts` exists (verified). Do not use `@/components` (circular). [app/src/CLAUDE.md — Sibling imports within `components/` use relative paths]

`GlassPanel` is not used in `ImageViewerDialogHeader` — it belongs to `ImageViewerDialog`'s root element.

---

### `ImageViewerDialogHeader.css` (new)

Move these rules verbatim from `ImageViewerDialog.css`:

```css
.image-viewer-dialog-header {
  display: flex;
  align-items: center;
  gap: var(--spacing-md);
  padding: var(--spacing-md);
}

.image-viewer-dialog-title {
  flex: 1;
}
```

Import this CSS file in `ImageViewerDialogHeader.tsx`.

---

### `components/index.ts` — new grouping barrel

```ts
export { ImageViewerDialogHeader } from './ImageViewerDialogHeader';
```

`FramingOverlay` is added to this barrel in SF6.

---

### `ImageViewerDialog.tsx` — updated

**New prop:** `dimensions?: { width: CSSProperties['width']; height: CSSProperties['height'] }`. Import `CSSProperties` from `'react'`. The `Props` type becomes:

```ts
type Props = {
  image_id: string;
  title: string;
  onClose: () => void;
  uploadFn: (filePath: string) => void;
  deleteFn: () => void;
  dimensions?: { width: CSSProperties['width']; height: CSSProperties['height'] };
};
```

**New state:** `const [mode, setMode] = useState<'view' | 'framing'>('view');`

**Remove:** `useLayoutEffect`, `headerRef`, and the header `<div>`. These move to `ImageViewerDialogHeader`.

**Remove import:** `useLayoutEffect` from `'react'` (no longer used). Keep `useRef` only if still needed — it is no longer needed after the header extraction, so remove `useRef` too.

**Add import:** `{ ImageViewerDialogHeader }` from `'./components'`. `./components` resolves to `ImageViewerDialog/components/index.ts`. ✓

**Add import:** `{ useState, CSSProperties }` — `useState` added to the existing react import; `CSSProperties` is a type import from `'react'`.

**Delete logic** remains in `ImageViewerDialog` — `handleDeleteClick` and the `useDeleteDialog` import stay.

**`handleReplaceClick`** remains unchanged.

**Return JSX:**

```tsx
return (
  <GlassPanel intensity='bright' className='image-viewer-dialog'>
    <ImageViewerDialogHeader
      title={title}
      onDeleteClick={handleDeleteClick}
      onReplaceClick={() => { void handleReplaceClick(); }}
      onSettingsClick={() => { setMode(m => m === 'view' ? 'framing' : 'view'); }}
      onClose={onClose}
    />
    {mode === 'view' && (
      <div className='image-viewer-dialog-content'>
        <ImageById
          imageId={image_id}
          className='image-viewer-dialog-img'
          alt={`${title} image`}
        />
      </div>
    )}
    {mode === 'framing' && null}
  </GlassPanel>
);
```

`{mode === 'framing' && null}` is the placeholder; SF6 replaces `null` with `<FramingOverlay ... />`.

**Cleanup:** Remove the `useLayoutEffect` import and `headerRef` declaration. Remove the now-unused `useRef` import. `dimensions` is received as a prop here and forwarded to `FramingOverlay` in SF6 — it has no use in SF5's render output. To avoid `noUnusedLocals` in the destructured props with `exactOptionalPropertyTypes`, prefix with `_` if necessary — but since `dimensions` will be used in SF6, omit `_` prefix. Implement SF5 and SF6 together if the TypeScript compiler flags `dimensions` as unused (they are a single batch).

---

### `ImageViewerDialog.css` — updated

Remove the two rules moved to `ImageViewerDialogHeader.css`:

```css
/* REMOVE: */
.image-viewer-dialog-header { ... }
.image-viewer-dialog-title { ... }
```

Keep:

```css
.image-viewer-dialog {
  display: flex;
  flex-direction: column;
  max-width: var(--dialog-max-width);
  max-height: var(--dialog-max-height);
}

.image-viewer-dialog-content {
  display: flex;
  justify-content: center;
}

.image-viewer-dialog-img {
  max-width: 100%;
  max-height: calc(
    var(--dialog-max-height) - var(--rt-image-viewer-dialog-header-h, 0px)
  );
}
```

---

### `UploadImgBtn.tsx` — updated

In the `createPortal` call, pass `dimensions` to `ImageViewerDialog`:

```tsx
<ImageViewerDialog
  image_id={image_id}
  title={title}
  onClose={() => { setPopupState('closed'); }}
  uploadFn={uploadFn}
  deleteFn={deleteFn}
  {...(dimensions !== undefined ? { dimensions } : {})}
/>
```

`dimensions` is already in scope (destructured from `UploadImgBtn` props). The conditional spread avoids passing `dimensions={undefined}` which would violate `exactOptionalPropertyTypes` (assigning `undefined` to `dimensions?: T`).

No other changes to `UploadImgBtn.tsx`.
