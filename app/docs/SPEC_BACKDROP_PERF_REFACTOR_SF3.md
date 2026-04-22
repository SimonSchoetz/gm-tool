# SF3: Performance Optimizations

Three targeted changes to `updateBeams` in `createBeams.ts`: cache `pathLength` on beam activation so it is
not recomputed every frame; store `beam.progress` on each spawned particle; replace the `.map().filter()`
chain with an explicit in-place for-loop.

Depends on SF1: `Beam.pathLength` and `Particle.progress` must exist as type fields before this sub-feature
can be implemented.

## Files affected

Modified:

- `app/src/components/Backdrop/helper/createBeams.ts`

New: none

## Layered breakdown

### Frontend

#### createBeams.ts — updateBeams function

Four changes apply inside `updateBeams`. The function signature and outer structure are unchanged; only the
two `if` blocks that handle beam activation and the active-beam update are modified.

**Change 1 — cache pathLength on activation**

In the `if (now > beam.nextSpawnTime && !beam.active)` block, after `beam.active = true`, add:

```ts
beam.pathLength = getPathLength(beam.path);
```

`getPathLength` is already imported — no new import needed.

**Change 2 — use beam.pathLength in the active-beam block**

In `if (beam.active && beam.path.length > 0)`, remove the line:

```ts
const pathLength = getPathLength(beam.path);
```

Replace every subsequent reference to `pathLength` with `beam.pathLength`. There is one such reference — the
completion check:

```ts
if (beam.progress >= beam.pathLength) {
```

**Change 3 — store progress when spawning a particle**

In the `if (currentPosition)` block, update the `beam.particles.push({...})` call to include `progress`:

```ts
beam.particles.push({
  x: currentPosition.x,
  y: currentPosition.y,
  age: 0,
  maxAge: beam.speed * 5,
  progress: beam.progress,
});
```

`beam.progress` is the beam's current path distance at the moment of spawning. This line comes before the
`beam.progress += beam.speed` increment that follows — the captured value is the position where this particle
was spawned, not the next position.

**Change 4 — in-place particle mutation**

Replace the trailing particle-update block:

```ts
beam.particles = beam.particles
  .map((particle) => ({ ...particle, age: particle.age + 1 }))
  .filter((particle) => particle.age < particle.maxAge);
```

With an explicit reverse-iteration for-loop:

```ts
for (let i = beam.particles.length - 1; i >= 0; i--) {
  beam.particles[i].age++;
  if (beam.particles[i].age >= beam.particles[i].maxAge) {
    beam.particles.splice(i, 1);
  }
}
```

Iterating in reverse allows `splice(i, 1)` to remove at the current index without invalidating the indices of
elements that have not yet been visited (all elements at indices lower than `i`).
