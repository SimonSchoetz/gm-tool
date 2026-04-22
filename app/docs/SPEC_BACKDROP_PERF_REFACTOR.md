# Spec: Backdrop Performance Refactor & Bug Fixes

## Progress Tracker

- Sub-feature 1: Type Changes — add `pathLength` to Beam, add `progress` to Particle; remove dead `currentIndex` field
- Sub-feature 2: Offscreen Grid Canvas — pre-render grid tiles once per init/resize; per-frame draw replaced with `drawImage`
- Sub-feature 3: Performance Optimizations — cache pathLength on beam activation; in-place particle age mutation; store beam.progress on particle spawn
- Sub-feature 4: generateZigzagPath Bug Fixes — fix path-too-short (rows+1) and fractional column (Math.ceil)
- Sub-feature 5: Corner Cutting Fix — add `getWaypointsBetween` helper; update `drawBeams` to follow path geometry between particles

Implement sub-features in the order listed. SF3 depends on SF1 (Beam.pathLength and Particle.progress must
exist as type fields before updateBeams writes them). SF5 depends on SF1 and SF3 (particles must carry a
`progress` value at spawn time before drawBeams can read it).

---

## Key Architectural Decisions

### OffscreenCanvas sized at CSS pixels (window.innerWidth × window.innerHeight)

The main canvas ctx is scaled by `dpr` via `ctx.scale(dpr, dpr)` in `setCanvasSize`. The `drawImage` call in
the animate loop uses `ctx.drawImage(offscreenCanvas, 0, 0)` — no explicit destination width/height. When the
main ctx has an active dpr transform, `drawImage` maps the image's pixel dimensions as CSS units. Sizing the
offscreen canvas to `window.innerWidth × window.innerHeight` makes the image width equal the CSS viewport
width; the dpr transform expands it to fill the full device pixel canvas (`canvas.width = innerWidth × dpr`).
Sizing at device pixels would overdraw by `dpr²`. The grid renders at CSS pixel resolution (1x); for a
decorative colour-block background the difference from device-pixel resolution is imperceptible.

### OffscreenCanvas as a closure variable inside the useEffect, not a ref

The OffscreenCanvas is created inside the `useEffect` callback and consumed only within that callback's scope
(`initCanvas`, `updateCanvasOnResize`, `animate`). A `useRef` would add React lifecycle overhead for a value
that never triggers a re-render and never escapes the effect. A `let` variable in the closure is correct:
`initCanvas` and `updateCanvasOnResize` reassign it; `animate` reads the current binding on every frame.
JavaScript closures capture bindings, not values — `animate` always sees the most recently assigned canvas.

### initBeams.ts must be touched to add pathLength: 0

The brief lists `initBeams.ts` as not-to-touch. However, `Beam.pathLength: number` (required, non-optional)
is added in SF1, and `initBeams.ts` is the sole constructor of `Beam` objects. Without `pathLength: 0` in
the object literal, TypeScript compilation fails under strict mode. This spec includes `initBeams.ts` in SF1's
modified files accordingly.

### currentIndex is dead code — remove alongside SF1

`Beam.currentIndex` is defined in `beam.type.ts` and initialized in `initBeams.ts` but is never read anywhere
in the codebase [grep "currentIndex" app/src/components/Backdrop — only two hits: definition and
initialization]. Remove the field from the type and the initializer from `initBeams.ts` as part of SF1.

### helper/index.ts barrel must switch to explicit named exports

`helper/` within `Backdrop/` is a within-component grouping barrel. CLAUDE.md mandates explicit named exports
for all grouping folders — `export *` is banned. SF5 touches this file to add the `getWaypointsBetween`
export; that touch is the opportunity to correct the existing violation.

### generateZigzagPath is not re-exported from the helper barrel

`generateZigzagPath` is imported directly by `createBeams.ts` (`import { generateZigzagPath } from
'./generateZigzagPath'`) and is intentionally absent from `helper/index.ts`. It is an internal helper, not
part of the public API consumed by `Backdrop.tsx`. The new barrel must continue to omit it. The same applies
to `getPositionOnPath`, `getPathLength`, `getColor`, and `rgbToRgba`.

---

## Sub-features

- [SF1: Type Changes](SPEC_BACKDROP_PERF_REFACTOR_SF1.md)
- [SF2: Offscreen Grid Canvas](SPEC_BACKDROP_PERF_REFACTOR_SF2.md)
- [SF3: Performance Optimizations](SPEC_BACKDROP_PERF_REFACTOR_SF3.md)
- [SF4: generateZigzagPath Bug Fixes](SPEC_BACKDROP_PERF_REFACTOR_SF4.md)
- [SF5: Corner Cutting Fix](SPEC_BACKDROP_PERF_REFACTOR_SF5.md)

---

## CLAUDE.md Impact

None. No new directories, layers, or structural patterns are introduced. Both barrel corrections (`helper/`
and `types/` — `export *` → explicit named exports) apply an existing rule already documented in root
CLAUDE.md — no rule update required.
