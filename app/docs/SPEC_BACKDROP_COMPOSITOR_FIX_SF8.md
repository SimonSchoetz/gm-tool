# SF8: generateZigzagPath End-Y Assertion

The existing test suite for `generateZigzagPath` [S_1: helper/__tests__/generateZigzagPath.test.ts:25–28] asserts the start y-coordinate equals `offsetY`, but has no assertion about the end y-coordinate. The loop in `generateZigzagPath` runs while `currentRow <= rows + 1` [S_2: helper/generateZigzagPath.ts:48], exiting only after incrementing past `rows + 1`. The last pushed point always has `y = offsetY + (rows + 1) * squareSize` — one row below the declared grid height. Add the missing end-y assertion.

## Files Affected

Modified:
- `app/src/components/Backdrop/helper/__tests__/generateZigzagPath.test.ts`

## Frontend

### `generateZigzagPath.test.ts`

Add one test case to the existing `describe` block:

```ts
it('ends one row below the declared grid height', () => {
  const path = generateZigzagPath(makeGridRef(grid));
  const expectedEndY = grid.offsetY + (grid.rows + 1) * grid.squareSize;
  expect(path[path.length - 1].y).toBe(expectedEndY);
});
```

No changes to existing tests or fixtures.
