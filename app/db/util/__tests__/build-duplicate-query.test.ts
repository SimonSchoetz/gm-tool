import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { buildDuplicateQuery } from '../build-duplicate-query';

describe('buildDuplicateQuery', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2024-01-15T10:30:00.000Z'));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('normalizes undefined copied values to null', () => {
    const { sql, values } = buildDuplicateQuery(
      'npcs',
      'new-id',
      { adventure_id: 'adv-1', summary: undefined },
      {},
    );

    expect(sql).toBe(
      'INSERT INTO npcs (id, adventure_id, summary, created_at, updated_at) VALUES ($1, $2, $3, $4, $5)',
    );
    expect(values).toEqual([
      'new-id',
      'adv-1',
      null,
      '2024-01-15T10:30:00.000Z',
      '2024-01-15T10:30:00.000Z',
    ]);
  });

  it('preserves null copied values as null', () => {
    const { values } = buildDuplicateQuery(
      'npcs',
      'new-id',
      { description: null },
      {},
    );

    expect(values).toEqual([
      'new-id',
      null,
      '2024-01-15T10:30:00.000Z',
      '2024-01-15T10:30:00.000Z',
    ]);
  });

  it('places overrides after copied columns and before timestamps', () => {
    const { sql, values } = buildDuplicateQuery(
      'npcs',
      'new-id',
      { adventure_id: 'adv-1' },
      { image_id: 'new-image-id' },
    );

    expect(sql).toBe(
      'INSERT INTO npcs (id, adventure_id, image_id, created_at, updated_at) VALUES ($1, $2, $3, $4, $5)',
    );
    expect(values).toEqual([
      'new-id',
      'adv-1',
      'new-image-id',
      '2024-01-15T10:30:00.000Z',
      '2024-01-15T10:30:00.000Z',
    ]);
  });

  it('generates fresh matching created_at and updated_at, not passed through copiedColumns', () => {
    const { values } = buildDuplicateQuery(
      'npcs',
      'new-id',
      { adventure_id: 'adv-1' },
      {},
    );

    expect(values.at(-2)).toBe('2024-01-15T10:30:00.000Z');
    expect(values.at(-1)).toBe('2024-01-15T10:30:00.000Z');
  });

  it('produces an INSERT with only id and timestamps when no columns or overrides are given', () => {
    const { sql, values } = buildDuplicateQuery('sessions', 'new-id', {}, {});

    expect(sql).toBe(
      'INSERT INTO sessions (id, created_at, updated_at) VALUES ($1, $2, $3)',
    );
    expect(values).toEqual([
      'new-id',
      '2024-01-15T10:30:00.000Z',
      '2024-01-15T10:30:00.000Z',
    ]);
  });
});
