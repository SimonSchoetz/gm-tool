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

describe('defineTable createTableSQL', () => {
  const child = defineTable({
    name: 'child_table',
    columns: {
      id: { type: 'TEXT', primaryKey: true, zod: z.string() },
      parent_id: {
        type: 'TEXT',
        notNull: true,
        zod: z.string(),
        foreignKey: { table: 'parents', column: 'id', onDelete: 'CASCADE' },
      },
      other_id: {
        type: 'TEXT',
        zod: z.string(),
        foreignKey: { table: 'others', column: 'key' },
      },
      status: { type: 'TEXT', default: "'open'", zod: z.string() },
      note: { type: 'TEXT', zod: z.string() },
    },
  });

  it('lists the columns in order, each with only the constraints it declares, then the foreign keys', () => {
    expect(child.createTableSQL.replace(/\s+/g, ' ').trim()).toBe(
      "CREATE TABLE IF NOT EXISTS child_table ( id TEXT PRIMARY KEY, parent_id TEXT NOT NULL, other_id TEXT, status TEXT DEFAULT 'open', note TEXT, FOREIGN KEY (parent_id) REFERENCES parents(id) ON DELETE CASCADE, FOREIGN KEY (other_id) REFERENCES others(key) )",
    );
  });

  it('lists each foreign-key column with the table it references, in column order', () => {
    expect(child.foreignKeys).toEqual([
      { column: 'parent_id', table: 'parents' },
      { column: 'other_id', table: 'others' },
    ]);
  });

  it('lists no foreign keys for a table that declares none', () => {
    expect(table.foreignKeys).toEqual([]);
  });
});
