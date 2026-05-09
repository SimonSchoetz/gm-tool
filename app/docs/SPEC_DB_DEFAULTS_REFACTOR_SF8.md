# SF8: Define-table Cleanup

Remove `ExtractCreateShape`, `generateCreateSchema`, and `createSchema` from `define-table.ts`.
By the time this SF runs, no domain `create.ts` calls `*.createSchema.parse()`, making
`createSchema` dead code on every `TableSchema` instance.

This SF must run last — after SF2 through SF7 have removed all `createSchema` callers.

## Files Affected

```
Modified:
  app/db/util/schema/define-table.ts
  app/db/util/schema/__tests__/define-table.test.ts
```

## DB Changes

### `app/db/util/schema/define-table.ts`

Remove the following:

1. The `ExtractCreateShape` type (lines ~30–38 in the current file)
2. The `generateCreateSchema()` function (lines ~120–135)
3. The `createSchema` field from `TableSchema` type and from `defineTable()`'s return value

The resulting `TableSchema` type:

```typescript
type TableSchema<T extends TableDefinition> = {
  name: T['name'];
  createTableSQL: string;
  zodSchema: z.ZodObject<ExtractZodShape<T['columns']>>;
  updateSchema: z.ZodObject<ExtractUpdateShape<T['columns']>>;
};
```

The resulting `defineTable()` return:

```typescript
return {
  name,
  createTableSQL: generateCreateTableSQL(name, columns),
  zodSchema: generateZodSchema(columns) as z.ZodObject<ExtractZodShape<T['columns']>>,
  updateSchema: generateUpdateSchema(columns) as z.ZodObject<ExtractUpdateShape<T['columns']>>,
};
```

Keep everything else: `ExtractZodShape`, `ExtractUpdateShape`, `generateZodSchema`,
`generateUpdateSchema`, `generateCreateTableSQL`, `ColumnDefinition`, `TableDefinition`.

### `app/db/util/schema/__tests__/define-table.test.ts`

Remove the first test entirely — it tests `createSchema` behavior that no longer exists:

```typescript
// Remove this test:
it('createSchema makes defaulted columns optional', () => { ... });
```

In the second test (`'should generate SQL and Zod schemas from table definition'`), remove
the assertion that checks `createSchema`:

```typescript
// Remove:
expect(table.createSchema).toBeDefined();
```

The second test otherwise remains unchanged.
