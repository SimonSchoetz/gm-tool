import { describe, it, expect } from 'vitest';
import { defineTable } from '../define-table';
import { z } from 'zod';

describe('defineTable', () => {
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
    expect(table.createTableSQL).toContain('CREATE TABLE IF NOT EXISTS test_table');
    expect(table.createTableSQL).toContain('id TEXT PRIMARY KEY');
    expect(table.createTableSQL).toContain('name TEXT NOT NULL');
    expect(table.zodSchema).toBeDefined();
    expect(table.createSchema).toBeDefined();
    expect(table.updateSchema).toBeDefined();
  });
});
