# SF3: Clock Unification

Replace the `Date.now()` calls in `updateBeams` and `initBeams` with a `now: number` parameter. All call sites in `Backdrop.tsx` pass `performance.now()` or the rAF timestamp. See root KAD "Clock unification uses performance.now() throughout" for why mixing the two epochs is wrong.

## Files Affected

Modified:
- `app/src/components/Backdrop/helper/updateBeams.ts`
- `app/src/components/Backdrop/helper/initBeams.ts`
- `app/src/components/Backdrop/Backdrop.tsx`

## Frontend

### `updateBeams.ts`

Add `now: number` as a third parameter. Remove `const now = Date.now();` from the function body — all occurrences of `now` already reference the right value; only the source changes.

```ts
export const updateBeams = (
  beamsRef: RefObject<Beam[]>,
  gridRef: RefObject<Grid>,
  now: number,
) => {
```

No other changes to the function body.

### `initBeams.ts`

Add `now: number` as a fourth parameter. Replace `Date.now()` in the `nextSpawnTime` initializer with the parameter:

```ts
export const initBeams = (
  beamsRef: RefObject<Beam[]>,
  numBeams: number,
  beamSpeed: number,
  now: number,
) => {
```

Change the `nextSpawnTime` line:

```ts
// Before:
nextSpawnTime: Date.now() + Math.random() * 10000 + i * 2000,
// After:
nextSpawnTime: now + Math.random() * 10000 + i * 2000,
```

### `Backdrop.tsx`

Three call sites require updating.

**`animate` — `updateBeams` call:** `now` is already in scope as the rAF timestamp parameter:

```ts
// Before:
for (let t = 0; t < ticks; t++) {
  updateBeams(beamsRef, gridRef);
}
// After:
for (let t = 0; t < ticks; t++) {
  updateBeams(beamsRef, gridRef, now);
}
```

**`initCanvas` — `initBeams` call:**

```ts
// Before:
initBeams(beamsRef, AMOUNT_BEAMS, BEAM_SPEED);
// After:
initBeams(beamsRef, AMOUNT_BEAMS, BEAM_SPEED, performance.now());
```

**`updateCanvasOnResize` — `initBeams` call:**

```ts
// Before:
initBeams(beamsRef, AMOUNT_BEAMS, BEAM_SPEED);
// After:
initBeams(beamsRef, AMOUNT_BEAMS, BEAM_SPEED, performance.now());
```

**Idle delay calculation:** The delay currently uses `Date.now()` as the reference clock. Replace with `performance.now()` so it is consistent with the `nextSpawnTime` values now set by `performance.now()`:

```ts
// Before:
const delay = Math.max(0, nextSpawnTime - Date.now());
// After:
const delay = Math.max(0, nextSpawnTime - performance.now());
```
