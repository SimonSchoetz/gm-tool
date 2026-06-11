# SPEC: Backdrop Compositor Fix

## Progress Tracker

- [SF1](SPEC_BACKDROP_COMPOSITOR_FIX_SF1.md): Compositor architecture — collapse two-canvas to single opaque canvas; restore grid from OffscreenCanvas per dirty rect; inline particle positions in draw loop
- [SF2](SPEC_BACKDROP_COMPOSITOR_FIX_SF2.md): Split drawAndUpdateBeams — separate `drawBeams.ts` and `updateBeams.ts` files
- [SF3](SPEC_BACKDROP_COMPOSITOR_FIX_SF3.md): Clock unification — inject `now: number` into `updateBeams` and `initBeams`; eliminate `Date.now()` calls
- [SF4](SPEC_BACKDROP_COMPOSITOR_FIX_SF4.md): Bounds import — replace inline object type in `Backdrop.tsx` with `Bounds` from types
- [SF5](SPEC_BACKDROP_COMPOSITOR_FIX_SF5.md): BEAM_BOUNDS_PADDING constant — extract to `Backdrop.constants.ts`
- [SF6](SPEC_BACKDROP_COMPOSITOR_FIX_SF6.md): `setGridDimensions` cleanup — collapse dead offset intermediates
- [SF7](SPEC_BACKDROP_COMPOSITOR_FIX_SF7.md): Tests — `setGridDimensions`, `initBeams`, `updateBeams`
- [SF8](SPEC_BACKDROP_COMPOSITOR_FIX_SF8.md): `generateZigzagPath` end-y assertion

## Key Architectural Decisions

### Single opaque canvas eliminates frame-rate-proportional WindowServer blending

The two-canvas architecture introduced a transparent beam canvas layered over an opaque grid canvas. Core Animation composites these two CA layers on every frame regardless of dirty rect size — the transparent layer blend is a fixed frame-rate cost, not a draw-area cost. At 20 fps (SIMULATION_TICK_MS = 1000 / 20) that cost scaled proportionally, confirming the compositor is the bottleneck. Collapsing to one opaque canvas (`{ alpha: false }`) removes the CA layer blend entirely. The grid is restored via `ctx.drawImage` targeting only the dirty rect on each frame — cost scales with dirty area, not frame rate.

### OffscreenCanvas sized at device pixels, drawn via scaled context

The `OffscreenCanvas` is created at `canvas.width × canvas.height` (device pixels, as set by `setCanvasSize`). `createGridTiles` draws in CSS-pixel coordinates using `window.innerWidth`, `window.innerHeight`, and grid dimensions from `setGridDimensions`. For this to correctly fill the device-pixel offscreen canvas, `offscreenCtx.scale(dpr, dpr)` is applied before calling `createGridTiles`. With the scale transform in place, `createGridTiles` requires no logic changes — its CSS-pixel fill covers the full device-pixel canvas through the transform.

### `drawImage` source rect uses device-pixel coordinates

The `ctx.drawImage(offscreen, sx, sy, sw, sh, dx, dy, dw, dh)` call uses device-pixel source coordinates (`r.x * dpr`, etc.) because the offscreen canvas pixel space is unscaled — its coordinates are in device pixels. The destination coordinates are in CSS pixels because `ctx` has `scale(dpr, dpr)` applied (from `setCanvasSize`). This asymmetry is intentional and required for correct alignment.

### Particle positions reused to eliminate `getWaypointsBetween` calls in the draw loop

Each particle already stores `x` and `y` at its position on the path (set by `getPositionOnPath` in `updateBeams`). The previous `drawBeams` called `getWaypointsBetween` to obtain start and end coordinates — but `olderParticle.x/y` and `particle.x/y` are already those exact values. The refactored loop builds waypoints directly from stored positions and scans `cumulativeLengths` for corner intermediates. `getWaypointsBetween.ts` is unchanged and still used by `getBeamBounds`.

### Clock unification uses performance.now() throughout

Before SF3, `lastTickTimeRef` and the rAF `now` parameter use `performance.now()` epoch (milliseconds since navigation, fractional), while `beam.nextSpawnTime` and the idle delay are set and read with `Date.now()` (milliseconds since Unix epoch, integer). These epochs are incompatible — the idle delay `nextSpawnTime - Date.now()` yields a meaningless value if `nextSpawnTime` was set with `performance.now()`. After SF3, all time values use `performance.now()`: `initBeams` and `updateBeams` receive a `now: number` parameter, and all call sites in `Backdrop.tsx` pass `performance.now()` or the rAF timestamp.

### BEAM_BOUNDS_PADDING lives at the Backdrop component root, not in helper/

The constant `BEAM_BOUNDS_PADDING = 4` is used by `Backdrop.tsx` when calling `getBeamBounds`. It is a configuration value owned by the component, not a helper utility. It belongs in `Backdrop.constants.ts` at the `Backdrop/` directory level. This file is imported directly in `Backdrop.tsx` (`'./Backdrop.constants'`) and in `getBeamBounds.test.ts` (`'../../Backdrop.constants'`). It does not go through the `helper/index.ts` barrel.

## CLAUDE.md Impact

None. This spec touches only `app/src/components/Backdrop/` internals. No conventions, domain scaffold, or documented examples are affected.
