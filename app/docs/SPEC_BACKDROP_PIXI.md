# Backdrop PixiJS Migration

## Progress Tracker

- Sub-feature 1: File Scaffold [FOUNDATION] — Delete Canvas2D-only helpers, add `createGridTileTexture`, update barrel, stub `Backdrop.tsx`, update CSS
- Sub-feature 2: PixiJS Backdrop — Full `Application` init, `TilingSprite` grid, `RenderTexture` beam trail, `Ticker` loop, resize handling
- Sub-feature 3: `createGridTileTexture` Test — Unit test for the new tile texture helper

## Key Architectural Decisions

### Single PixiJS WebGL canvas; no Canvas2D elements

`Application` creates one `<canvas>` backed by WebGL. Grid and beams are both rendered into that single surface. This eliminates the Core Animation compositor blending cost caused by overlapping canvases — previously the root cause of high WindowServer GPU usage.

### Grid via `TilingSprite` from a pre-baked tile `Texture`

A single `squareSize × squareSize` tile is drawn with PixiJS `Graphics` (outer half-opacity rect + 2×2 inner solid quads), then baked into a `Texture` via `app.renderer.textureGenerator.generateTexture(g)`. A `TilingSprite` uses that texture to cover the screen in one GPU draw call. The tile texture is destroyed and recreated on resize. `TilingSprite.width` and `.height` are updated to new window dimensions on every resize.

### Background color is the pre-composited primary-tint value

The original Canvas2D code drew a `primaryRgb, 0.1` semi-transparent fill over the entire canvas before painting tiles. In PixiJS, this is achieved by computing the composited value at init time: `compositeColor = rgb(br + pr×0.1, bg + pg×0.1, bb + pb×0.1)`. This value is passed to `app.init({ backgroundColor: ... })`. The tile texture gap area (the untouched 0.5px at the tile's right and bottom edges) is transparent, so the `backgroundColor` shows through, reproducing the original tinted look.

### Beam trail via `RenderTexture` persistence

A full-screen `RenderTexture` (`beamRenderTexture`) accumulates beam history. Each tick: (1) render a full-screen semi-transparent `bgColor` fill onto `beamRenderTexture` with `clear: false` — this fades existing content toward the background color; (2) render beam head segments onto `beamRenderTexture` with `clear: false` — new head segments appear bright and fade over subsequent ticks. A `Sprite(beamRenderTexture)` sits on `app.stage` above the `TilingSprite`, displaying the accumulated trail. [API verified: `renderer.render({ container, target, clear: CLEAR_OR_BOOL })` at `AbstractRenderer.d.ts:229`; `CLEAR_OR_BOOL = CLEAR | boolean` at `gl/const.d.ts:29`]

### `BEAM_TAIL_ALPHA` controls trail length indirectly

`BEAM_TAIL_ALPHA` is the alpha of the per-tick fade fill. Lower value = slower fade = longer visible trail. Higher value = faster fade = shorter trail. At `maxFPS = 30` and `BEAM_TAIL_ALPHA = 0.05`, the trail is visible for approximately one second. This constant is the primary knob for trail length experimentation.

### Colors read at init time and cached as strings

All colors are read once via `getColor()` at the start of `init()` and stored as local string variables. Creating `new Color(string)` from the cached strings in the tick loop is acceptable overhead at 30fps. Colors are not re-read per tick. Theme changes take effect on next component mount (page reload).

### `Graphics` objects pre-allocated; cleared per tick

Two `Graphics` objects are allocated once: `fadeGraphics` and `headGraphics`. Both are cleared via `graphics.clear()` each tick and rebuilt from cached colors. This avoids per-tick allocation/GC at the cost of rebuilding shape commands, which is negligible at 30fps with a small number of beams. [Verified: `Graphics.clear(): this` at `Graphics.d.ts:1501`]

### Idle scheduler stops the `Ticker` when all beams finish

When the last active beam reaches the end of its path, `app.ticker.stop()` is called. A `setTimeout(spawnAllBeams, IDLE_RESPAWN_DELAY_MS)` schedules the next wave. `spawnAllBeams` calls `app.ticker.start()` before returning. A reference to the timeout ID is stored so the cleanup function can cancel it if the component unmounts during the idle window.

### Beam path helpers are kept unchanged

`generateZigzagPath`, `getCumulativeLengths`, `getPositionOnPath`, `setGridDimensions`, `getColor` contain no Canvas2D APIs and are kept as-is. `Backdrop.tsx` imports them from the `./helper` barrel. The `types/` directory (`Grid` type) is unchanged.

### `gridRef` lives at component scope; `beams` live in the `useEffect` closure

`const gridRef = useRef<Grid>(null)` is declared at component scope so `setGridDimensions(gridRef)` can mutate it and the resize handler can read the updated value. `Grid` includes `null` in its union type, so `null` is a valid initial value — TypeScript resolves `useRef<Grid>(null)` to `MutableRefObject<Grid>`. The `beams` array and all PixiJS object references are declared inside the `useEffect` closure (mutable `let` variables) because they are animation state, not React state.

### `beamRenderTexture` destroyed and recreated on resize

On resize, `beamRenderTexture?.destroy(true)` is called and a new `RenderTexture.create(...)` is created at the new dimensions. The beam sprite's `.texture` property is updated to point to the new texture. All beams are reset to inactive and respawned immediately (no idle delay after resize). [Verified: `RenderTexture extends Texture` at `RenderTexture.d.ts:18`; `Sprite.texture: Texture` at `Sprite.d.ts:57`; `RenderTexture.create` at `RenderTexture.d.ts:28`]

### `cancelled` flag guards async init on fast unmount

`init()` is async (due to `await app.init()`). If the component unmounts before `await` resolves, the cleanup function sets `cancelled = true`. The init function checks this flag after `await` completes and calls `app.destroy()` immediately if cancelled, without appending the canvas to the DOM.

## Sub-feature Files

- [SF1: File Scaffold](SPEC_BACKDROP_PIXI_SF1.md)
- [SF2: PixiJS Backdrop](SPEC_BACKDROP_PIXI_SF2.md)
- [SF3: createGridTileTexture Test](SPEC_BACKDROP_PIXI_SF3.md)

## CLAUDE.md Impact

None. No CLAUDE.md files reference specific component file paths. The `Backdrop` component is not a domain entity — no `domain-scaffold.md` update required.
