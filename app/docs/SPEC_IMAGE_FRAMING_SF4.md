# SF4 — HoloImg: Apply Frame CSS Custom Properties

`HoloImg` calls `useImage` to read `frame` data and passes it as CSS custom properties to `ImageById`, which spreads them onto `<img>`. The `.holo-img` CSS class consumes the vars.

## Files Affected

Modified:
- `app/src/components/HoloImg/HoloImg.tsx`
- `app/src/components/HoloImg/HoloImg.css`

## Frontend

### Purpose

`HoloImg` is the thumbnail display used in entity list screens. It must apply the stored frame configuration (pan position + zoom) so the configured crop region is visible in the list view.

### Behavior

- `HoloImg` calls `useImage(image_id)` — returns `{ imageUrl, frame, loading }`. TanStack Query deduplicates this with the call already made by the `ImageById` child; no additional network request.
- When `frame` is non-null: three CSS custom properties are set on `ImageById` via the `style` prop, overriding the CSS fallback defaults.
- When `frame` is null: no `style` prop is passed; `.holo-img` CSS fallback values apply (`50% 0%` position, scale 1), reproducing the current `object-position: top` behavior.
- Loading and error states are unchanged — the existing `ImageById` / `ImagePlaceholderFrame` behavior handles these.

### `app/src/components/HoloImg/HoloImg.tsx`

Add `useImage` import from `@/data-access-layer`. Add `frame` destructure from the hook result. Pass frame CSS vars conditionally to `ImageById`.

```tsx
import { useImage } from '@/data-access-layer';
```

Inside the component body, before the return statement:

```tsx
const { frame } = useImage(image_id);
```

On the `ImageById` element, add a conditional `style` prop:

```tsx
<ImageById
  imageId={image_id}
  alt={`${title} preview`}
  className={cn('holo-img', isActive && 'active')}
  {...(frame !== null
    ? {
        style: {
          '--rt-holo-img-frame-x': `${frame.x}%`,
          '--rt-holo-img-frame-y': `${frame.y}%`,
          '--rt-holo-img-frame-zoom': frame.zoom,
        } as React.CSSProperties,
      }
    : {})}
/>
```

The conditional spread passes no `style` when `frame` is null, leaving the CSS fallback values in effect. `ImageById` accepts `HtmlProps<'img'>` which includes `style?: React.CSSProperties`; the spread is valid. `exactOptionalPropertyTypes` is satisfied because `style` is either fully absent (empty spread) or fully present (no `T | undefined` assignment to an optional `T` property).

`React` is already in scope via `react-jsx` transform; no additional import needed for `React.CSSProperties`.

### `app/src/components/HoloImg/HoloImg.css`

Replace the `object-position` line in `.holo-img` and add `transform` and `transform-origin`:

```css
.holo-img {
  height: 100%;
  width: 100%;
  object-fit: cover;
  object-position: var(--rt-holo-img-frame-x, 50%) var(--rt-holo-img-frame-y, 0%);
  transform: scale(var(--rt-holo-img-frame-zoom, 1));
  transform-origin: var(--rt-holo-img-frame-x, 50%) var(--rt-holo-img-frame-y, 0%);
  transition: var(--transition-hover-off);
  filter: brightness(1) contrast(1) saturate(1);
}
```

Fallback values reproduce the previous `object-position: top` behavior: `50%` horizontal (center), `0%` vertical (top), zoom 1 (no scale). `ImagePlaceholderFrame` already has `overflow: hidden` on `.adventure-frame`, clipping any overflow from `scale()` beyond the frame boundary.

All other rules in `HoloImg.css` (`.holo-img.active`, `.holo-img-title`, `.tilt-fx-container`, `.tilt-fx`, `.tilt-fx.active`, `.tilt-fx:hover`) are unchanged.
