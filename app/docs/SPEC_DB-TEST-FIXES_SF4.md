# SF4: adventure/create Test Fix

`adventure/__tests__/create.test.ts` has two tests that read specific positions from the mock values array (`values[1]`, `values[2]`, `values[3]`). Replace with position-independent checks. No source file changes.

## Files Affected

**Modified:**
- `app/db/adventure/__tests__/create.test.ts` — replace positional reads in the second and third `it()` blocks

## DB Tests

### `app/db/adventure/__tests__/create.test.ts`

The first test (`'should insert adventure and return generated ID'`) is unchanged.

**Second test** — replace `values[1]` with a `find`-based check:

Replace:

```typescript
it('should create adventure with a default name prefixed "New adventure"', async () => {
  await create();

  const [, values] = mockExecute.mock.calls[0] as [string, unknown[]];
  expect(values[1]).toMatch(/^New adventure /);
});
```

With:

```typescript
it('should create adventure with a default name prefixed "New adventure"', async () => {
  await create();

  const [, values] = mockExecute.mock.calls[0] as [string, unknown[]];
  const name = values.find((v): v is string => typeof v === 'string' && v.startsWith('New adventure '));
  expect(name).toBeDefined();
});
```

**Third test** — replace `values[2]` and `values[3]` with negative-index reads. Timestamps are always the last two values produced by `buildCreateQuery` for this entity. Use `Array.prototype.at` with negative indices, matching the pattern in `image/__tests__/create.test.ts`:

Replace:

```typescript
it('should set created_at and updated_at as ISO 8601 timestamps', async () => {
  await create();

  const [, values] = mockExecute.mock.calls[0] as [string, unknown[]];
  expect(values[2]).toBe('2024-01-15T10:30:00.000Z');
  expect(values[3]).toBe('2024-01-15T10:30:00.000Z');
});
```

With:

```typescript
it('should set created_at and updated_at as ISO 8601 timestamps', async () => {
  await create();

  const [, values] = mockExecute.mock.calls[0] as [string, unknown[]];
  expect(values.at(-2)).toBe('2024-01-15T10:30:00.000Z');
  expect(values.at(-1)).toBe('2024-01-15T10:30:00.000Z');
});
```
