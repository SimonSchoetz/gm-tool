import { describe, it, expect } from 'vitest';
import { defineTable } from '../define-table';
import { z } from 'zod';

const table = defineTable({
  name: 'test_table',
  columns: {
    id: {
      type: 'TEXT',
      primaryKey: true,
      zod: z.string(),
    },
    name: {
      type: 'TEXT',
      notNull: true,
      zod: z.string().min(1),
    },
    level: {
      type: 'INTEGER',
      zod: z.number(),
      updateZod: z.number().max(1),
    },
    created_at: {
      type: 'TEXT',
      zod: z.string(),
    },
    updated_at: {
      type: 'TEXT',
      zod: z.string(),
    },
  },
});

describe('defineTable', () => {
  it('should generate the table name and SQL from the table definition', () => {
    expect(table.name).toBe('test_table');
    expect(table.createTableSQL).toContain(
      'CREATE TABLE IF NOT EXISTS test_table',
    );
    expect(table.createTableSQL).toContain('id TEXT PRIMARY KEY');
    expect(table.createTableSQL).toContain('name TEXT NOT NULL');
  });

  it('should leave the id and both timestamps out of updateSchema', () => {
    expect(Object.keys(table.updateSchema.shape).sort()).toEqual([
      'level',
      'name',
    ]);
  });

  it('should accept an empty update, since every column is optional', () => {
    expect(table.updateSchema.parse({})).toEqual({});
  });

  it('should validate a column with updateZod against it in updateSchema rather than against its zod', () => {
    expect(table.zodSchema.shape.level.safeParse(2).success).toBe(true);
    expect(table.updateSchema.safeParse({ level: 2 }).success).toBe(false);
  });
});
