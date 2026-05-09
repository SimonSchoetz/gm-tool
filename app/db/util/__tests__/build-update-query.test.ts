import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { buildUpdateQuery } from '../build-update-query';

describe('buildUpdateQuery', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2024-01-15T10:30:00.000Z'));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('should generate UPDATE SQL for a single field', () => {
    const { sql, values } = buildUpdateQuery('adventures', 'test-id', {
      name: 'New Name',
    });

    expect(sql).toBe(
      'UPDATE adventures SET name = $1, updated_at = $2 WHERE id = $3',
    );
    expect(values).toEqual(['New Name', '2024-01-15T10:30:00.000Z', 'test-id']);
  });

  it('should generate UPDATE SQL for multiple fields in entry order', () => {
    const { sql, values } = buildUpdateQuery('adventures', 'test-id', {
      name: 'New Name',
      description: 'New Desc',
    });

    expect(sql).toBe(
      'UPDATE adventures SET name = $1, description = $2, updated_at = $3 WHERE id = $4',
    );
    expect(values).toEqual([
      'New Name',
      'New Desc',
      '2024-01-15T10:30:00.000Z',
      'test-id',
    ]);
  });

  it('should skip undefined values', () => {
    const { sql, values } = buildUpdateQuery('adventures', 'test-id', {
      name: 'Name',
      description: undefined,
    });

    expect(sql).toBe(
      'UPDATE adventures SET name = $1, updated_at = $2 WHERE id = $3',
    );
    expect(values).toEqual(['Name', '2024-01-15T10:30:00.000Z', 'test-id']);
  });

  it('should use the correct final parameter index for id', () => {
    const { sql, values } = buildUpdateQuery('sessions', 'sess-id', {
      name: 'A',
      summary: 'B',
    });

    expect(sql).toContain('updated_at = $3 WHERE id = $4');
    expect(values[3]).toBe('sess-id');
  });
});
