# SPEC: LoadingIcon

## Progress Tracker

- SF1: Create LoadingIcon — create the SVG animation component and register it in `src/components/`

## Key Architectural Decisions

### SVG + CSS over PixiJS

PixiJS `Application.init()` is async — the loading indicator would be invisible during WebGL context setup, which is exactly when it needs to be visible. SVG renders synchronously in the browser compositor with zero initialization delay. The visual requirement (branded beam on a square perimeter) maps directly to a `stroke-dashoffset` CSS animation on an SVG `<rect>`.

### Counter-clockwise via positive stroke-dashoffset

SVG `<rect>` traces clockwise by default (top-left → top-right → bottom-right → bottom-left). A positive `stroke-dashoffset` shifts the visible dash pattern backward along the path — opposite to the drawing direction — producing counter-clockwise apparent motion. Animate `stroke-dashoffset` from `0` to `+perimeter` at `1.5s linear infinite` for one continuous counter-clockwise revolution per cycle.

### CSS custom property for animation endpoint

The `stroke-dashoffset` animation target (the full perimeter) depends on the `size` prop and cannot be a static CSS constant. Set `--loading-icon-perimeter` (with `px` units) on the SVG root via the `style` prop. The `@keyframes` `to` frame references `var(--loading-icon-perimeter)`. CSS custom properties substituted as `<length>` values (`${n}px`) are valid in `@keyframes` in Chromium-based WebViews. Prefix `--loading-icon-` (no `--rt-` segment) because this is a JS-computed static value, not DB-sourced — per `app/src/CLAUDE.md` static CSS custom property convention.

### strokeDasharray as JSX SVG attribute

`stroke-dasharray` accepts unitless user-unit numbers as an SVG presentation attribute, but requires `<length>` values as a CSS property. Setting it via the JSX `strokeDasharray` attribute avoids browser-compatibility questions for unitless values in CSS context. Both beam length and gap are computed from `size` and set as JSX attribute values.

### overflow: visible for drop-shadow extent

CSS `filter: drop-shadow()` extends visually beyond the element's bounding box. SVG defaults to `overflow: hidden`, clipping the glow. Set `overflow: visible` on `.loading-icon` so the drop-shadow renders outside the SVG bounds.

### No gradient tail

A tail that fades behind the beam head requires per-frame gradient-coordinate updates (the gradient direction must rotate with the beam position), reintroducing JavaScript frame management. The beam is a solid-opacity stroke; `filter: drop-shadow()` on the SVG root provides the branded glow signal without runtime JS.

### STROKE_WIDTH = 2

At the 16px default size, a 1px stroke (as used in the full-screen Backdrop) is visually too thin. `STROKE_WIDTH = 2` is a module-level constant in `LoadingIcon.tsx`. The `<rect>` is inset by `STROKE_WIDTH / 2` on all sides so the stroke stays within the SVG viewport at all prop values.

### Beam length = one side (25% of perimeter)

`beamLength = size - STROKE_WIDTH` — one side of the inset rect — equals exactly 25% of the perimeter (`4 × sideLength`). This creates a clearly visible moving segment without appearing to fill the square.

### Updater.tsx — out of scope

`app/src/components/Header/components/Updater/Updater.tsx` - the implementing instance must not touch `Updater.tsx`. The user will update the component manually after this spec is implemented. During the baseline check, flag the Updater.tsx tsc error to the user as a known pre-existing exclusion and proceed.

---

## SF1: Create LoadingIcon

### Files affected

New:
- `app/src/components/LoadingIcon/LoadingIcon.tsx`
- `app/src/components/LoadingIcon/LoadingIcon.css`
- `app/src/components/LoadingIcon/index.ts`

Modified:
- `app/src/components/index.ts` — add `LoadingIcon` export at end of file

### Frontend

**Purpose:** App-wide loading indicator that renders a primary-colored beam tracing the perimeter of a square counter-clockwise with a glow that matches the Backdrop beam's branded aesthetic.

**Behavior:** Stateless; always animating when mounted. The optional `size` prop controls the SVG dimensions in pixels; defaults to `16`. No loading, error, or empty states — the component is itself the loading state signal.

**UI / Visual:** Square SVG at `size × size` px. A single `<rect>` inset by `STROKE_WIDTH / 2` on all sides with `stroke: var(--color-primary)` and `fill: none`. A `drop-shadow` filter on the SVG root adds the glow. The beam covers one side length and completes one counter-clockwise revolution per `1.5s`.

#### `app/src/components/LoadingIcon/LoadingIcon.tsx`

```tsx
import type { CSSProperties } from 'react';
import { FCProps } from '@/types';
import './LoadingIcon.css';

type Props = {
  size?: number;
};

const STROKE_WIDTH = 2;

export const LoadingIcon: FCProps<Props> = ({ size = 16 }) => {
  const sideLength = size - STROKE_WIDTH;
  const perimeter = 4 * sideLength;
  const beamLength = sideLength;
  const gap = perimeter - beamLength;

  return (
    <svg
      className="loading-icon"
      width={size}
      height={size}
      style={{ '--loading-icon-perimeter': `${perimeter}px` } as CSSProperties}
    >
      <rect
        className="loading-icon-beam"
        x={STROKE_WIDTH / 2}
        y={STROKE_WIDTH / 2}
        width={sideLength}
        height={sideLength}
        strokeWidth={STROKE_WIDTH}
        strokeDasharray={`${beamLength} ${gap}`}
      />
    </svg>
  );
};
```

- `FCProps<Props>` is case-3 (closed API — the SVG does not forward attributes). Correct for a component with one optional prop.
- `import type { CSSProperties } from 'react'` — required to type the `as CSSProperties` assertion on the `style` prop. `React.CSSProperties` is not in scope without an explicit import when using `"jsx": "react-jsx"`.
- `STROKE_WIDTH / 2` produces `1` — a number, valid for SVG `x`/`y` attributes in JSX.
- `${perimeter}px` — `perimeter` is `number`; template literal is allowed by `restrict-template-expressions: { allowNumber: true }` in `app/eslint.config.js`.

#### `app/src/components/LoadingIcon/LoadingIcon.css`

```css
.loading-icon {
  overflow: visible;
  filter: drop-shadow(0 0 3px var(--color-primary)); /* one-off */
}

.loading-icon-beam {
  fill: none;
  stroke: var(--color-primary);
  animation: loading-icon-trace 1.5s linear infinite; /* one-off */
}

@keyframes loading-icon-trace {
  from {
    stroke-dashoffset: 0;
  }
  to {
    stroke-dashoffset: var(--loading-icon-perimeter);
  }
}
```

- `3px` and `1.5s` are raw values marked `/* one-off */` per `app/src/CLAUDE.md` design token obligation.
- Class names follow flat BEM-ish convention: `.loading-icon` (root), `.loading-icon-beam` (nested shape). No `__` element suffix.
- `animation-name` `loading-icon-trace` scoped to this component via the `loading-icon-` prefix.

#### `app/src/components/LoadingIcon/index.ts`

```ts
export { LoadingIcon } from './LoadingIcon';
```

Explicit named export — `export *` is not used.

#### `app/src/components/index.ts` — add at end

```ts
export { LoadingIcon } from './LoadingIcon';
```

Barrel form (`'./LoadingIcon'`, no `.tsx` extension, no double-name path) — `LoadingIcon/index.ts` exists, so the barrel form is correct per `app/src/CLAUDE.md`.

---

## CLAUDE.md Impact

None.
