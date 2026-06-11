# SF2: Type foundations [FOUNDATION: SF3 depends on this]

[FOUNDATION: SF3 depends on this. Adding required fields to `Beam` breaks `initBeams.ts` and `createBeams.ts` (which construct `Beam` objects) until SF3 supplies the initialization values. Do not run baseline checks after this SF alone — run only after SF3 is also complete.

Stage as unit:
- `app/src/components/Backdrop/types/bounds.type.ts`
- `app/src/components/Backdrop/types/beam.type.ts`
- `app/src/components/Backdrop/types/index.ts`
- `app/src/components/Backdrop/helper/getCumulativeLengths.ts`
- `app/src/components/Backdrop/helper/extractColorTriplet.ts`
- `app/src/components/Backdrop/helper/getPositionOnPath.ts`
- `app/src/components/Backdrop/helper/getWaypointsBetween.ts`
- `app/src/components/Backdrop/helper/initBeams.ts`
- `app/src/components/Backdrop/helper/createBeams.ts`
- `app/src/components/Backdrop/helper/index.ts`
- Delete: `app/src/components/Backdrop/helper/getPathLength.ts`
- Delete: `app/src/components/Backdrop/helper/rgbToRgba.ts`]

Add the `Bounds` type and three new required fields to `Beam`. These are consumed by SF3's creation-site updates and by SF5's dirty-rect logic.

## Files Affected

New:
- `app/src/components/Backdrop/types/bounds.type.ts`

Modified:
- `app/src/components/Backdrop/types/beam.type.ts`
- `app/src/components/Backdrop/types/index.ts`

## Frontend

### `types/bounds.type.ts` (new)

```ts
export type Bounds = {
  x: number;
  y: number;
  width: number;
  height: number;
};
```

### `types/beam.type.ts` (modified)

Add three required fields. Import `Bounds` directly from `./bounds.type` (not through the barrel — importing through the barrel this file is part of creates a circular dependency).

```ts
import { Particle } from './particle.type';
import { Bounds } from './bounds.type';

export type Beam = {
  path: { x: number; y: number }[];
  particles: Particle[];
  color: string;
  nextSpawnTime: number;
  progress: number;
  pathLength: number;
  speed: number;
  active: boolean;
  cumulativeLengths: number[];
  colorTriplet: string | null;
  lastDrawnBounds: Bounds | null;
};
```

`cumulativeLengths` — prefix sums of segment lengths, set at path generation time, consumed by updated `getPositionOnPath` and `getWaypointsBetween` in SF3.

`colorTriplet` — the `"r, g, b"` triplet string parsed once from `beam.color` at spawn, consumed by `drawBeams` in SF3.

`lastDrawnBounds` — the bounding box of the beam's last drawn frame, consumed by SF5's dirty-rect logic in `Backdrop.tsx`.

### `types/index.ts` (modified)

Add `Bounds` export. All exports use `export type`:

```ts
export type { Beam } from './beam.type';
export type { Bounds } from './bounds.type';
export type { Grid } from './grid.type';
export type { Particle } from './particle.type';
```
