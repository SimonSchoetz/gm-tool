# SF6: setGridDimensions Cleanup

Collapse the dead intermediate variable `offset` in `setGridDimensions`. The current code assigns `offset` once and immediately aliases it into `offsetX` and `offsetY` — the alias variables add no information. Replace with direct declarations.

## Files Affected

Modified:
- `app/src/components/Backdrop/helper/setGridDimensions.ts`

## Frontend

### `setGridDimensions.ts`

Replace the three-step intermediate pattern:

```ts
// Before:
const offset = -squareSize / 2;
const offsetX = offset;
const offsetY = offset;
// After:
const offsetX = -squareSize / 2;
const offsetY = -squareSize / 2;
```

No other changes to the function.
