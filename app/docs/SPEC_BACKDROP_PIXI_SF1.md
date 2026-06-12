# SF1: File Scaffold

[FOUNDATION: SF2–SF3 depend on this. Stage as unit: app/src/components/Backdrop/Backdrop.tsx, app/src/components/Backdrop/Backdrop.css, app/src/components/Backdrop/helper/createGridTileTexture.ts, app/src/components/Backdrop/helper/index.ts]

Delete Canvas2D-only helpers, create the PixiJS tile texture helper, update the barrel, replace `Backdrop.tsx` with a stub that compiles without the deleted files, and update the CSS class.

## Files Affected

Modified:
- `app/src/components/Backdrop/Backdrop.tsx` — replace Canvas2D implementation with a container div stub; remove all Canvas2D imports
- `app/src/components/Backdrop/Backdrop.css` — rename `.backdrop-grid` to `.backdrop-container`; add `pointer-events: none`
- `app/src/components/Backdrop/helper/index.ts` — replace single `rebuildCanvas` export with the six helpers `Backdrop.tsx` will import in SF2

New:
- `app/src/components/Backdrop/helper/createGridTileTexture.ts` — PixiJS `Graphics` → `Texture` for a single grid tile

Deleted:
- `app/src/components/Backdrop/helper/createGridTiles.ts`
- `app/src/components/Backdrop/helper/rebuildCanvas.ts`
- `app/src/components/Backdrop/helper/setCanvasSize.ts`
- `app/src/components/Backdrop/helper/__tests__/createGridTiles.test.ts`
- `app/src/components/Backdrop/helper/__tests__/rebuildCanvas.test.ts`

## Frontend

### `Backdrop.tsx` stub

Purpose: provide a compilable placeholder so SF1 can be committed alone without tsc errors.

```tsx
import './Backdrop.css';

export const Backdrop = () => <div className='backdrop-container' />;
```

No imports from `./helper` or `./types` — the stub has no logic.

### `Backdrop.css`

Replace the existing `.backdrop-grid` rule with `.backdrop-container`. Add `pointer-events: none` so the backdrop div does not intercept mouse events.

```css
.backdrop-container {
  position: fixed;
  top: 0;
  left: 0;
  z-index: -10;
  pointer-events: none;
}
```

### `helper/createGridTileTexture.ts`

Creates a PixiJS `Texture` for a single grid tile from `Graphics` draw commands, replicating the per-tile visual from the original `createGridTiles.ts` (outer half-opacity rect + 2×2 inner solid quads).

This function is called by `Backdrop.tsx` (SF2) — it has no consumer in SF1.

```ts
import { Application, Color, Graphics } from 'pixi.js';
import { getColor } from './getColor';

export const createGridTileTexture = (app: Application, squareSize: number) => {
  const bgColor = getColor('--color-bg');
  const bgRgb = getColor('--color-bg-rgb');
  const innerSize = (squareSize - 1) / 2;

  const g = new Graphics();

  g.rect(0, 0, squareSize - 0.5, squareSize - 0.5)
    .fill({ color: new Color(`rgb(${bgRgb})`), alpha: 0.5 });

  for (let i = 0; i < 2; i++) {
    for (let j = 0; j < 2; j++) {
      g.rect(
        j * innerSize + (j > 0 ? 1 : 0),
        i * innerSize + (i > 0 ? 1 : 0),
        innerSize - (j > 0 ? 1 : 0),
        innerSize - (i > 0 ? 1 : 0),
      ).fill({ color: new Color(bgColor) });
    }
  }

  return app.renderer.textureGenerator.generateTexture(g);
};
```

The tile gap (0.5px at the right and bottom edges) is naturally transparent in the generated texture because no shape covers it. The `backgroundColor` set on the PixiJS `Application` (the composited bg+tint color) shows through the gap. No `clearColor` is passed to `generateTexture` — the default transparent background is correct.

This replicates the original algorithm from `createGridTiles.ts:27–42` with no logic changes, only API translation from Canvas2D to PixiJS.

### `helper/index.ts`

Replace the single `rebuildCanvas` export with the six helpers that `Backdrop.tsx` (SF2) imports:

```ts
export { createGridTileTexture } from './createGridTileTexture';
export { generateZigzagPath } from './generateZigzagPath';
export { getCumulativeLengths } from './getCumulativeLengths';
export { getColor } from './getColor';
export { getPositionOnPath } from './getPositionOnPath';
export { setGridDimensions } from './setGridDimensions';
```
