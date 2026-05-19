# SF3: NPC + Foe Create Test Fixes

Both `npc/__tests__/create.test.ts` and `foe/__tests__/create.test.ts` carry the same two defects: a positional index (`values[2]`) and a test name that claims `summary` is asserted when the body never asserts it. Fix both files identically.

## Files Affected

**Modified:**
- `app/db/npc/__tests__/create.test.ts` — replace second test body
- `app/db/foe/__tests__/create.test.ts` — replace second test body

## DB Tests

### `app/db/npc/__tests__/create.test.ts`

Replace the second `it()` block only. The first test (`'should insert NPC and return generated ID'`) and third test (`'should throw when adventure_id is empty'`) are unchanged.

Replace:

```typescript
it('should set adventure_id, default name, summary, and ISO timestamps', async () => {
  await create('adventure-123');

  const [sql, values] = mockExecute.mock.calls[0] as [string, unknown[]];
  expect(sql).toContain('INSERT INTO npcs');
  expect(values).toContain('adventure-123');
  const name = values[2] as string;
  expect(name).toMatch(/^New NPC /);
  expect(values).toContain('2024-01-15T10:30:00.000Z');
});
```

With:

```typescript
it('should set adventure_id, default name, summary, and ISO timestamps', async () => {
  await create('adventure-123');

  expect(mockExecute).toHaveBeenCalledWith(
    expect.stringContaining('INSERT INTO npcs'),
    [
      'test-generated-id',
      'adventure-123',
      expect.stringMatching(/^New NPC /),
      expect.stringContaining('"type":"root"'),
      '2024-01-15T10:30:00.000Z',
      '2024-01-15T10:30:00.000Z',
    ],
  );
});
```

The values array position order is `[id, adventure_id, name, summary, created_at, updated_at]` — this matches the field insertion order in `npc/create.ts` where `buildCreateQuery` is called with `{ adventure_id, name, summary, ...timestamps }` and `id` is prepended. The array assertion documents this contract explicitly.

`expect.stringContaining('"type":"root"')` asserts that the Lexical JSON default is written without coupling to the full template string.

### `app/db/foe/__tests__/create.test.ts`

Apply the identical change. The only differences from the NPC version are the table name and name prefix:

Replace the second `it()` block:

```typescript
it('should set adventure_id, default name, summary, and ISO timestamps', async () => {
  await create('adventure-123');

  expect(mockExecute).toHaveBeenCalledWith(
    expect.stringContaining('INSERT INTO foes'),
    [
      'test-generated-id',
      'adventure-123',
      expect.stringMatching(/^New Foe /),
      expect.stringContaining('"type":"root"'),
      '2024-01-15T10:30:00.000Z',
      '2024-01-15T10:30:00.000Z',
    ],
  );
});
```

The first and third tests are unchanged.
