import { describe, it, expect } from 'vitest';
import { buildCreateQuery } from '../build-create-query';

describe('buildCreateQuery', () => {
  it('should generate INSERT SQL with id and all defined fields', () => {
    const { sql, values } = buildCreateQuery('sessions', 'test-id', {
      adventure_id: 'adv-1',
      name: 'Session 1',
    });

    expect(sql).toBe(
      'INSERT INTO sessions (id, adventure_id, name) VALUES ($1, $2, $3)',
    );
    expect(values).toEqual(['test-id', 'adv-1', 'Session 1']);
  });

  it('should skip undefined fields', () => {
    const { sql, values } = buildCreateQuery('sessions', 'test-id', {
      adventure_id: 'adv-1',
      name: undefined,
    });

    expect(sql).toBe('INSERT INTO sessions (id, adventure_id) VALUES ($1, $2)');
    expect(values).toEqual(['test-id', 'adv-1']);
  });

  it('should produce INSERT with only id when validated object has no defined fields', () => {
    const { sql, values } = buildCreateQuery('test_table', 'test-id', {});

    expect(sql).toBe('INSERT INTO test_table (id) VALUES ($1)');
    expect(values).toEqual(['test-id']);
  });

  it('should start id at $1 and use sequential indices', () => {
    const { sql, values } = buildCreateQuery('npcs', 'npc-id', {
      a: 1,
      b: 2,
      c: 3,
    });

    expect(sql).toContain('($1, $2, $3, $4)');
    expect(values[0]).toBe('npc-id');
    expect(values).toEqual(['npc-id', 1, 2, 3]);
  });
});
