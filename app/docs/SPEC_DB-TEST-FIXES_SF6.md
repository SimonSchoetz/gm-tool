# SF6: session get/update/remove it() Splits

`session/__tests__/get.test.ts`, `session/__tests__/update.test.ts`, and `session/__tests__/remove.test.ts` each contain one `it()` block that makes two `rejects.toThrow` assertions (empty string and whitespace). If the first assertion fails, the second never runs. Split each into two `it()` blocks. No source file changes, no assertion text changes.

## Files Affected

**Modified:**
- `app/db/session/__tests__/get.test.ts` — split combined validation `it()` into two
- `app/db/session/__tests__/update.test.ts` — split combined validation `it()` into two
- `app/db/session/__tests__/remove.test.ts` — split combined validation `it()` into two

## DB Tests

### `app/db/session/__tests__/get.test.ts`

Replace:

```typescript
it('should throw error when id is invalid', async () => {
  await expect(get('')).rejects.toThrow('Valid session ID is required');
  await expect(get('   ')).rejects.toThrow('Valid session ID is required');
});
```

With:

```typescript
it('should throw error when id is empty', async () => {
  await expect(get('')).rejects.toThrow('Valid session ID is required');
});

it('should throw error when id is whitespace only', async () => {
  await expect(get('   ')).rejects.toThrow('Valid session ID is required');
});
```

### `app/db/session/__tests__/update.test.ts`

Replace:

```typescript
it('should throw error when id is invalid', async () => {
  const updates: Partial<Session> = { name: 'Test' };

  await expect(update('', updates)).rejects.toThrow(
    'Valid session ID is required',
  );
  await expect(update('   ', updates)).rejects.toThrow(
    'Valid session ID is required',
  );
});
```

With:

```typescript
it('should throw error when id is empty', async () => {
  const updates: Partial<Session> = { name: 'Test' };

  await expect(update('', updates)).rejects.toThrow(
    'Valid session ID is required',
  );
});

it('should throw error when id is whitespace only', async () => {
  const updates: Partial<Session> = { name: 'Test' };

  await expect(update('   ', updates)).rejects.toThrow(
    'Valid session ID is required',
  );
});
```

### `app/db/session/__tests__/remove.test.ts`

Replace:

```typescript
it('should throw error when id is invalid', async () => {
  await expect(remove('')).rejects.toThrow('Valid session ID is required');
  await expect(remove('   ')).rejects.toThrow('Valid session ID is required');
});
```

With:

```typescript
it('should throw error when id is empty', async () => {
  await expect(remove('')).rejects.toThrow('Valid session ID is required');
});

it('should throw error when id is whitespace only', async () => {
  await expect(remove('   ')).rejects.toThrow('Valid session ID is required');
});
```
