# SF1: Type Changes

Add `pathLength: number` to `Beam`, add `progress: number` to `Particle`. Remove dead `currentIndex: number`
from `Beam`. Remove an inaccurate inline comment from `beam.type.ts`. Update `initBeams.ts` to initialize
both new fields and drop the removed field. Fix the `types/index.ts` barrel violation (`export *` → explicit
named exports).

## Files affected

Modified:

- `app/src/components/Backdrop/types/beam.type.ts`
- `app/src/components/Backdrop/types/particle.type.ts`
- `app/src/components/Backdrop/types/index.ts`
- `app/src/components/Backdrop/helper/initBeams.ts`

New: none

## Layered breakdown

### Frontend

#### beam.type.ts

Replace the entire type definition:

```ts
import { Particle } from './particle.type';

export type Beam = {
  path: { x: number; y: number }[];
  particles: Particle[];
  color: string;
  nextSpawnTime: number;
  progress: number;
  pathLength: number;
  speed: number;
  active: boolean;
};
```

Changes from the current definition:

- Remove `currentIndex: number` — field is written in `initBeams.ts` and defined here, but never read
  anywhere in the codebase [grep "currentIndex" app/src/components/Backdrop — confirmed two hits only:
  definition at `types/beam.type.ts:5` and initialization at `helper/initBeams.ts:13`]
- Remove the inline comment `// 0 to 1, tracks position along path` from `progress` — the comment
  documents WHAT (banned by CLAUDE.md) and is also factually incorrect (`progress` is pixel distance along
  the path, not a 0–1 ratio)
- Add `pathLength: number` after `progress`

#### particle.type.ts

Replace the entire type definition:

```ts
export type Particle = {
  x: number;
  y: number;
  age: number;
  maxAge: number;
  progress: number;
};
```

Change: add `progress: number` as the last field. `progress` stores the beam's path distance at the moment
the particle was spawned (set in SF3); `drawBeams` reads it in SF5 to route segments through corners.

#### types/index.ts

Replace the entire file:

```ts
export { Beam } from './beam.type';
export { Particle } from './particle.type';
export { Grid } from './grid.type';
```

`types/` within `Backdrop/` is a within-module grouping barrel — the same category as `helper/`. CLAUDE.md
mandates explicit named exports for grouping barrels; `export *` is banned. Each type file exports exactly
one type; the single named export per line is correct. No consumers of this barrel are affected: the exported
symbols (`Beam`, `Particle`, `Grid`) are unchanged.

#### initBeams.ts

Update the object literal in `beamsRef.current.push({...})`:

- Remove `currentIndex: 0`
- Add `pathLength: 0`

Full updated push call (all other lines unchanged):

```ts
beamsRef.current.push({
  path: [],
  particles: [],
  color: getColor('--color-primary'),
  nextSpawnTime: Date.now() + Math.random() * 10000 + i * 2000,
  progress: 0,
  pathLength: 0,
  speed: beamSpeed + i * 0.5,
  active: false,
});
```
