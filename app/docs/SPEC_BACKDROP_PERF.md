# SPEC: Backdrop Performance Refactor

## Progress Tracker

- SF1: Two-canvas layout + CSS — Separate static grid and dynamic beam into two canvases; move inline styles to CSS
- SF2: Type foundations [FOUNDATION] — Add `Bounds` type and three new fields to `Beam`; SF3 depends on this
- SF3: Caching helpers + creation sites — `getCumulativeLengths`, `extractColorTriplet`, updated path helpers, updated creation sites, delete dead files
- SF4: Fixed-timestep simulation — Replace per-frame simulation with wall-clock timestep; split `createBeams` into separately callable `updateBeams` + `drawBeams`
- SF5: Dirty-rect rendering — `getBeamBounds` helper; clear and clip only beam trail bounding boxes per frame
- SF6: Idle scheduler — Stop the rAF loop when all beams are inactive and restart via `setTimeout` at next spawn time
- SF7: Tests — New and updated test files for all new/changed pure helpers

## Key Architectural Decisions

### Two stacked canvases replace the OffscreenCanvas blit pattern

The previous architecture pre-rendered the grid into an `OffscreenCanvas` and blitted it onto the visible canvas every frame via `ctx.drawImage`. This invalidated the entire window layer at display refresh rate even while all beams were asleep, driving WindowServer CPU to ~29%. The fix separates concerns at the compositing level: the grid canvas (`alpha: false`, opaque) is painted once at init and on resize only; the beam canvas (transparent default) sits on top in DOM order and is the only surface touched per frame. The full-screen blit is removed. The grid canvas is painted directly (same `CanvasRenderingContext2D` API), which also fixes the retina blurriness caused by the previous DPR mismatch between the CSS-pixel-sized `OffscreenCanvas` and the DPR-scaled visible context.

### Cumulative length prefix sums replace per-call `sqrt` traversals

`getPositionOnPath` and `getWaypointsBetween` previously recomputed segment lengths via `Math.sqrt` on every call. With 6 beams each carrying up to ~20 particles, `getWaypointsBetween` was called per particle per frame, triggering 2–3 `sqrt` traversals each. Paths are generated once and never change mid-life. Storing prefix sums (`cumulativeLengths: number[]`) on the `Beam` at path generation time reduces all path-traversal calls to array index lookups with no `sqrt`. `pathLength` is derived as `cumulativeLengths.at(-1) ?? 0` and remains on `Beam` for the existing progress-completion check.

### Color triplet caching eliminates per-particle regex parse

`rgbToRgba` ran a regex match on `beam.color` once per particle per frame. The color never changes after spawn. Parsing once at spawn into `colorTriplet: string | null` (the `"r, g, b"` triplet string) and using `` `rgb(${triplet}, ${opacity})` `` eliminates the repeated regex cost. When the parse fails (null), `beam.color` is used unchanged as a safe fallback.

### Fixed-timestep simulation decouples speed from display refresh rate

The previous frame-count simulation (`beam.progress += beam.speed` per rAF tick) ran twice as fast on 120 Hz displays, both doubling visual speed and doubling per-frame work. A fixed 60 Hz timestep (`SIMULATION_TICK_MS = 1000 / 60`) with a wall-clock accumulator (`lastTickTimeRef`) ensures consistent simulation speed across all display refresh rates. `MAX_TICKS_PER_FRAME = 4` prevents a burst after background throttling.

### Dirty-rect rendering bounds the per-frame draw area

Instead of clearing and redrawing the full beam canvas each frame, only the union of each beam's previous draw bounds and current draw bounds is cleared and clipped. A `Path2D` clip ensures translucent stroke segments cannot double-blend outside the cleared region. Since every visible particle's opacity changes every frame, the full visible trail is included in each beam's dirty rect — not just the head's movement delta. A beam that just finished (no particles, non-null `lastDrawnBounds`) still contributes its previous bounds once so the final fade pixels are cleared.

### Idle scheduler eliminates rAF cost during beam sleep windows

Beams sleep 5–15 s between spawns. The rAF loop now self-terminates when all beams are `!active` with empty `particles` arrays. It restarts via `window.setTimeout` timed to the nearest `nextSpawnTime`. Both the rAF handle and the timeout are cancelled in the effect cleanup. The resize handler also cancels any pending timeout before resetting and restarting the loop.

### `createBeams` wrapper removed; `updateBeams` and `drawBeams` exported separately

The split into fixed-timestep simulation and dirty-rect rendering requires `Backdrop.tsx` to call simulation and draw independently. The `createBeams` convenience wrapper (which called both in sequence) loses its only caller after `Backdrop.tsx` is updated and is deleted per the re-derive-types rule. `updateBeams` and `drawBeams` are exported directly from `createBeams.ts` and added to the `helper/` barrel.

### `z-index: -10` is inlined; no token exists in `styles/variables/`

The design token obligation requires CSS values to reference tokens from `styles/variables/`. No z-index token exists in `styles/variables/` as of this spec. Per the no-unilateral-additions rule, no new token is added here. The value `-10` is inlined in `Backdrop.css`. If the user later decides to add a z-index token, that is a separate change.

## Sub-feature Files

- [SF1: Two-canvas layout + CSS](SPEC_BACKDROP_PERF_SF1.md)
- [SF2: Type foundations](SPEC_BACKDROP_PERF_SF2.md)
- [SF3: Caching helpers + creation sites](SPEC_BACKDROP_PERF_SF3.md)
- [SF4: Fixed-timestep simulation](SPEC_BACKDROP_PERF_SF4.md)
- [SF5: Dirty-rect rendering](SPEC_BACKDROP_PERF_SF5.md)
- [SF6: Idle scheduler](SPEC_BACKDROP_PERF_SF6.md)
- [SF7: Tests](SPEC_BACKDROP_PERF_SF7.md)

## CLAUDE.md Impact

None. This refactor touches only `app/src/components/Backdrop/` internals. No new structural patterns, no new layer conventions, no domain scaffold changes, and no CLAUDE.md example paths are affected.
