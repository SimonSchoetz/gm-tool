import { describe, it, expect } from 'vitest';
import { buildUpdateQuery } from '../build-update-query';

describe('buildUpdateQuery', () => {
  it('should generate UPDATE SQL for a single field', () => {
    const { sql, values } = buildUpdateQuery('adventures', 'test-id', {
      name: 'New Name',
    });

    expect(sql).toBe(
      'UPDATE adventures SET name = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2',
    );
    expect(values).toEqual(['New Name', 'test-id']);
  });

  it('should generate UPDATE SQL for multiple fields in entry order', () => {
    const { sql, values } = buildUpdateQuery('adventures', 'test-id', {
      name: 'New Name',
      description: 'New Desc',
    });

    expect(sql).toBe(
      'UPDATE adventures SET name = $1, description = $2, updated_at = CURRENT_TIMESTAMP WHERE id = $3',
    );
    expect(values).toEqual(['New Name', 'New Desc', 'test-id']);
  });

  it('should skip undefined values', () => {
    const { sql, values } = buildUpdateQuery('adventures', 'test-id', {
      name: 'Name',
      description: undefined,
    });

    expect(sql).toBe(
      'UPDATE adventures SET name = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2',
    );
    expect(values).toEqual(['Name', 'test-id']);
  });

  it('should use the correct final parameter index for id', () => {
    const { sql, values } = buildUpdateQuery('sessions', 'sess-id', {
      name: 'A',
      summary: 'B',
    });

    expect(sql).toContain('updated_at = CURRENT_TIMESTAMP WHERE id = $3');
    expect(values[2]).toBe('sess-id');
  });
});
