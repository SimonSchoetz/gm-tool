import { describe, it, expect } from 'vitest';
import { buildUpdateSortOrdersQuery } from '../build-update-sort-orders-query';

describe('buildUpdateSortOrdersQuery', () => {
  it('binds each id with its sort order, then the timestamp, then every id for the row limit', () => {
    const { sql, values } = buildUpdateSortOrdersQuery(
      'widgets',
      [
        { id: 'b', sort_order: 0 },
        { id: 'a', sort_order: 1 },
      ],
      '2026-01-10T09:00:00.000Z',
    );

    expect(sql).toBe(
      'UPDATE widgets SET sort_order = CASE id WHEN $1 THEN $2 WHEN $3 THEN $4 END, updated_at = $5 WHERE id IN ($6, $7)',
    );
    expect(values).toEqual([
      'b',
      0,
      'a',
      1,
      '2026-01-10T09:00:00.000Z',
      'b',
      'a',
    ]);
  });

  it('rejects an empty list, which has no valid CASE', () => {
    expect(() =>
      buildUpdateSortOrdersQuery('widgets', [], '2026-01-10T09:00:00.000Z'),
    ).toThrow(/^At least one row is required$/);
  });
});
