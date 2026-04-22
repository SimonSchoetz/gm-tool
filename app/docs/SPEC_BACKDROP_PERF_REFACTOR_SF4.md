# SF4: generateZigzagPath Bug Fixes

Three targeted line-level changes in `generateZigzagPath.ts`. No other logic changes.

## Files affected

Modified:

- `app/src/components/Backdrop/helper/generateZigzagPath.ts`

New: none

## Layered breakdown

### Frontend

#### generateZigzagPath.ts

**Fix 1 — path too short, loop guard (line 49)**

Change:

```ts
while (currentRow <= rows) {
```

To:

```ts
while (currentRow <= rows + 1) {
```

**Fix 2 — fractional column bound (line 53)**

Change:

```ts
const newCol = Math.max(0, Math.min(cols - 1, currentCol + direction));
```

To:

```ts
const newCol = Math.max(0, Math.min(Math.ceil(cols) - 1, currentCol + direction));
```

**Fix 3 — path too short, waypoint guard (line 64)**

Change:

```ts
if (currentRow <= rows) {
```

To:

```ts
if (currentRow <= rows + 1) {
```

No other lines change. The `Direction` const object, `getNextDirection` helper, `startSide`/`offset` logic,
initial `path.push`, and all remaining `path.push` calls are untouched.
