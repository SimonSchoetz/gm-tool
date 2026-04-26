import { describe, it, expect } from 'vitest';
import { defineTable } from '../define-table';
import { z } from 'zod';

describe('defineTable', () => {
  it('createSchema makes defaulted columns optional', () => {
    const table = defineTable({
      name: 'test_defaults',
      columns: {
        id: { type: 'TEXT', primaryKey: true, zod: z.string() },
        required_col: { type: 'TEXT', notNull: true, zod: z.string() },
        defaulted_col: {
          type: 'INTEGER',
          notNull: true,
          default: '0',
          zod: z.number(),
        },
      },
    });

    const withRequired = table.createSchema.safeParse({
      required_col: 'hello',
    });
    expect(withRequired.success).toBe(true);

    const withDefaulted = table.createSchema.safeParse({
      required_col: 'hello',
      defaulted_col: 1,
    });
    expect(withDefaulted.success).toBe(true);

    const missingRequired = table.createSchema.safeParse({});
    expect(missingRequired.success).toBe(false);
  });

  it('should generate SQL and Zod schemas from table definition', () => {
    const table = defineTable({
      name: 'test_table',
      columns: {
        id: {
          type: 'TEXT',
          primaryKey: true,
          zod: z.string().optional(),
        },
        name: {
          type: 'TEXT',
          notNull: true,
          zod: z.string().min(1),
        },
      },
    });

    expect(table.name).toBe('test_table');
    expect(table.createTableSQL).toContain(
      'CREATE TABLE IF NOT EXISTS test_table',
    );
    expect(table.createTableSQL).toContain('id TEXT PRIMARY KEY');
    expect(table.createTableSQL).toContain('name TEXT NOT NULL');
    expect(table.zodSchema).toBeDefined();
    expect(table.createSchema).toBeDefined();
    expect(table.updateSchema).toBeDefined();
  });
});
