# SF2: PixiJS Backdrop

Replace the stub `Backdrop.tsx` from SF1 with the full PixiJS implementation: a single WebGL canvas rendering the grid via `TilingSprite` and beam trails via `RenderTexture` persistence, driven by a capped `Ticker` with an idle scheduler.

## Files Affected

Modified:
- `app/src/components/Backdrop/Backdrop.tsx` — replace stub with full PixiJS component

## Frontend

### Purpose

`Backdrop` is a fixed, full-screen background component. It renders a tiled grid and animated light beams that travel random zigzag paths and leave a fading trail. All rendering is done in a single PixiJS WebGL canvas, eliminating the compositor blending cost of the previous two-canvas approach.

### Behavior

- On mount: `await app.init(...)` initializes PixiJS, appends the canvas to the container div, builds the grid and beam render textures, spawns all beams, and starts the ticker.
- Tick loop (30fps cap): fades the beam render texture toward the background color, then draws current beam head positions.
- When all beams finish their path: ticker stops; after `IDLE_RESPAWN_DELAY_MS` all beams respawn and the ticker restarts.
- On window resize: renderer resizes, tile texture recreated, beam render texture recreated, grid recalculated, beams respawned.
- On unmount: resize listener removed, pending idle timeout cleared, PixiJS application destroyed (canvas removed from DOM via `removeView: true`).

### `Backdrop.tsx`

#### Constants (top of module, before the component)

```ts
const AMOUNT_BEAMS = 5;
const BEAM_SPEED = 0.15;         // pixels per ms
const BEAM_TAIL_ALPHA = 0.05;    // per-tick fade fill alpha — lower = longer trail
const IDLE_RESPAWN_DELAY_MS = 2000;
```

#### Beam type (top of module)

```ts
type Beam = {
  path: { x: number; y: number }[];
  cumulativeLengths: number[];
  headDistance: number;
  speed: number;
  active: boolean;
};
```

#### Component

```tsx
export const Backdrop = () => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const gridRef = useRef<Grid>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    let cancelled = false;
    let app: Application | null = null;
    let tilingSprite: TilingSprite | null = null;
    let beamRenderTexture: RenderTexture | null = null;
    let beamSprite: Sprite | null = null;
    let tileTexture: ReturnType<typeof createGridTileTexture> | null = null;
    let idleTimeoutId: ReturnType<typeof setTimeout> | null = null;

    const beams: Beam[] = Array.from({ length: AMOUNT_BEAMS }, () => ({
      path: [],
      cumulativeLengths: [],
      headDistance: 0,
      speed: BEAM_SPEED,
      active: false,
    }));

    const spawnBeam = (beam: Beam) => {
      beam.path = generateZigzagPath(gridRef);
      beam.cumulativeLengths = getCumulativeLengths(beam.path);
      beam.headDistance = 0;
      beam.speed = BEAM_SPEED * (0.8 + Math.random() * 0.4);
      beam.active = true;
    };

    const spawnAllBeams = () => {
      beams.forEach(spawnBeam);
      app?.ticker.start();
    };

    const init = async () => {
      const bgRgb = getColor('--color-bg-rgb');
      const primaryRgb = getColor('--color-primary-rgb');
      const primaryColor = getColor('--color-primary');
      const [br, bg_c, bb] = bgRgb.split(',').map(Number);
      const [pr, pg, pb] = primaryRgb.split(',').map(Number);
      const compositeR = Math.round(br + pr * 0.1);
      const compositeG = Math.round(bg_c + pg * 0.1);
      const compositeB = Math.round(bb + pb * 0.1);
      const bgCompositeColor = `rgb(${compositeR}, ${compositeG}, ${compositeB})`;

      app = new Application();
      await app.init({
        width: window.innerWidth,
        height: window.innerHeight,
        backgroundColor: new Color(bgCompositeColor),
        resolution: window.devicePixelRatio,
        autoDensity: true,
        preference: 'webgl',
      });

      if (cancelled) {
        app.destroy({ removeView: true }, true);
        return;
      }

      container.appendChild(app.canvas);

      setGridDimensions(gridRef);

      tileTexture = createGridTileTexture(app, gridRef.current!.squareSize);
      tilingSprite = new TilingSprite({
        texture: tileTexture,
        width: window.innerWidth,
        height: window.innerHeight,
      });
      app.stage.addChild(tilingSprite);

      beamRenderTexture = RenderTexture.create({
        width: window.innerWidth,
        height: window.innerHeight,
        dynamic: true,
      });
      app.renderer.clear({
        target: beamRenderTexture,
        clearColor: new Color(bgCompositeColor),
      });
      beamSprite = new Sprite(beamRenderTexture);
      app.stage.addChild(beamSprite);

      app.ticker.maxFPS = 30;

      const fadeGraphics = new Graphics();
      const headGraphics = new Graphics();

      app.ticker.add((ticker: Ticker) => {
        const { deltaMS } = ticker;

        fadeGraphics
          .clear()
          .rect(0, 0, window.innerWidth, window.innerHeight)
          .fill({ color: new Color(`rgb(${bgRgb})`), alpha: BEAM_TAIL_ALPHA });
        app!.renderer.render({
          container: fadeGraphics,
          target: beamRenderTexture!,
          clear: false,
        });

        headGraphics.clear();
        let anyActive = false;

        for (const beam of beams) {
          if (!beam.active) continue;
          anyActive = true;

          const totalLength = beam.cumulativeLengths.at(-1) ?? 0;
          const prevDistance = beam.headDistance;
          beam.headDistance += beam.speed * deltaMS;

          if (beam.headDistance >= totalLength) {
            beam.active = false;
            continue;
          }

          const pos = getPositionOnPath(
            beam.path,
            beam.cumulativeLengths,
            beam.headDistance,
          );
          const prevPos = getPositionOnPath(
            beam.path,
            beam.cumulativeLengths,
            Math.max(0, prevDistance),
          );

          if (pos && prevPos) {
            headGraphics
              .moveTo(prevPos.x, prevPos.y)
              .lineTo(pos.x, pos.y)
              .stroke({ width: 2, color: new Color(primaryColor), alpha: 1 });
          }
        }

        app!.renderer.render({
          container: headGraphics,
          target: beamRenderTexture!,
          clear: false,
        });

        if (!anyActive) {
          app!.ticker.stop();
          idleTimeoutId = setTimeout(spawnAllBeams, IDLE_RESPAWN_DELAY_MS);
        }
      });

      spawnAllBeams();
    };

    const buildCompositeColor = () => {
      const bgRgb = getColor('--color-bg-rgb');
      const primaryRgb = getColor('--color-primary-rgb');
      const [br, bg_c, bb] = bgRgb.split(',').map(Number);
      const [pr, pg, pb] = primaryRgb.split(',').map(Number);
      return `rgb(${Math.round(br + pr * 0.1)}, ${Math.round(bg_c + pg * 0.1)}, ${Math.round(bb + pb * 0.1)})`;
    };

    const handleResize = () => {
      if (!app || !tilingSprite || !beamSprite) return;

      app.renderer.resize(window.innerWidth, window.innerHeight);
      tilingSprite.width = window.innerWidth;
      tilingSprite.height = window.innerHeight;

      setGridDimensions(gridRef);

      tileTexture?.destroy(true);
      tileTexture = createGridTileTexture(app, gridRef.current!.squareSize);
      tilingSprite.texture = tileTexture;

      beamRenderTexture?.destroy(true);
      beamRenderTexture = RenderTexture.create({
        width: window.innerWidth,
        height: window.innerHeight,
        dynamic: true,
      });
      app.renderer.clear({
        target: beamRenderTexture,
        clearColor: new Color(buildCompositeColor()),
      });
      beamSprite.texture = beamRenderTexture;

      if (idleTimeoutId !== null) {
        clearTimeout(idleTimeoutId);
        idleTimeoutId = null;
      }
      beams.forEach(b => {
        b.active = false;
      });
      spawnAllBeams();
    };

    window.addEventListener('resize', handleResize);
    void init();

    return () => {
      cancelled = true;
      window.removeEventListener('resize', handleResize);
      if (idleTimeoutId !== null) clearTimeout(idleTimeoutId);
      if (app) {
        app.ticker.stop();
        app.destroy({ removeView: true }, true);
        app = null;
      }
    };
  }, []);

  return <div ref={containerRef} className='backdrop-container' />;
};
```

#### Imports

```ts
import { Application, Color, Graphics, RenderTexture, Sprite, Ticker, TilingSprite } from 'pixi.js';
import { useEffect, useRef } from 'react';
import {
  createGridTileTexture,
  generateZigzagPath,
  getCumulativeLengths,
  getColor,
  getPositionOnPath,
  setGridDimensions,
} from './helper';
import type { Grid } from './types';
import './Backdrop.css';
```

### UI / Visual

The component renders a single `<div className='backdrop-container'>` (position fixed, z-index -10). PixiJS appends its `<canvas>` as the sole child. The canvas covers the full viewport; `autoDensity: true` sets the CSS dimensions to CSS pixels while the physical buffer scales with `devicePixelRatio`. The background color (composited navy + teal tint) fills behind the tile sprites. The tiled grid appears through the tile texture gaps. Beams appear as bright primary-color line segments that leave a fading trail as they travel zigzag paths downward.

### Notes

- `bg_c` is used instead of `bg` as the local variable name for the green channel to avoid shadowing any outer scope `bg` identifier. The implementer may choose any non-conflicting name.
- `buildCompositeColor()` is a local helper declared in the `useEffect` closure for use in the resize handler. It duplicates the composite computation from `init()`. This duplication is intentional — `init()` also caches `bgRgb` and `primaryRgb` strings for the tick loop, which the resize handler does not need.
- The `!` non-null assertions (`gridRef.current!.squareSize`, `app!`, `beamRenderTexture!`) are safe at their call sites because: `setGridDimensions(gridRef)` always populates `gridRef.current` before the assertion is reached; `app!` inside the ticker callback can only fire while the ticker is running, which requires `app` to be non-null; `beamRenderTexture!` is likewise only passed inside the ticker callback which runs after init assigns it.
