# SF5: adventure/get + adventure/remove Whitespace Tests

`adventure/__tests__/get.test.ts` and `adventure/__tests__/remove.test.ts` each test the empty-string validation case but not the whitespace-only case. Every other `get` and `remove` in the DB layer covers both. Add the missing `it()` block to each file. No source file changes.

## Files Affected

**Modified:**
- `app/db/adventure/__tests__/get.test.ts` — add whitespace-only validation test
- `app/db/adventure/__tests__/remove.test.ts` — add whitespace-only validation test

## DB Tests

### `app/db/adventure/__tests__/get.test.ts`

Add after the existing `'should throw error when id is empty'` test:

```typescript
it('should throw error when id is whitespace only', async () => {
  await expect(get('   ')).rejects.toThrow('Valid adventure ID is required');
  expect(mockSelect).not.toHaveBeenCalled();
});
```

### `app/db/adventure/__tests__/remove.test.ts`

Add after the existing `'should throw error when id is empty'` test:

```typescript
it('should throw error when id is whitespace only', async () => {
  await expect(remove('   ')).rejects.toThrow('Valid adventure ID is required');
  expect(mockExecute).not.toHaveBeenCalled();
});
```

The error message `'Valid adventure ID is required'` matches the existing empty-string test in both files — it is produced by `assertValidId(id, 'adventure')` in the source.
