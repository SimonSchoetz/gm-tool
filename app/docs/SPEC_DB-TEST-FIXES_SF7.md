# SF7: image Test Fixes

Two fixes in `image/__tests__/update.test.ts`: add a missing whitespace-only validation test and strengthen the null values assertion. One fix in `image/__tests__/create.test.ts`: remove a redundant test whose distinction from the remaining test does not exist in the type.

## Files Affected

**Modified:**
- `app/db/image/__tests__/update.test.ts` — add whitespace test; fix null assertion
- `app/db/image/__tests__/create.test.ts` — remove one redundant test

## DB Tests

### `app/db/image/__tests__/update.test.ts`

**Fix 1 — Add whitespace-only validation test.**

Add after the existing `'throws when id is empty'` test:

```typescript
it('throws when id is whitespace only', async () => {
  await expect(
    update('   ', { frame_x: 50, frame_y: 25, frame_zoom: 1.0 })
  ).rejects.toThrow('Valid image ID is required');
});
```

**Fix 2 — Strengthen the null values assertion.**

The current `'sets null frame values'` test only checks that `'test-id'` appears in the params. Replace the second `expect` to also verify that the three null values are passed:

Replace:

```typescript
it('sets null frame values', async () => {
  await update('test-id', { frame_x: null, frame_y: null, frame_zoom: null });

  expect(mockExecute).toHaveBeenCalledWith(
    expect.stringContaining('UPDATE images'),
    expect.arrayContaining(['test-id']),
  );
});
```

With:

```typescript
it('sets null frame values', async () => {
  await update('test-id', { frame_x: null, frame_y: null, frame_zoom: null });

  expect(mockExecute).toHaveBeenCalledWith(
    expect.stringContaining('UPDATE images'),
    expect.arrayContaining([null, null, null, 'test-id']),
  );
});
```

`expect.arrayContaining([null, null, null, 'test-id'])` verifies that three null entries and the id all appear in the params array, confirming the null values reach the DB rather than being silently dropped.

### `app/db/image/__tests__/create.test.ts`

**Remove the `'should create image with only required fields'` test** (lines 69–89 of the current file). `CreateImageInput` has a single field (`filePath`) — the all-vs-required distinction does not exist in the type, making the two tests structurally identical. The remaining test (`'should create image with all fields'`) covers the case.

Do not change any other test in the file.
