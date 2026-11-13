import { describe, it, expect } from 'vitest';
import { buildAppendQuery } from '../build-append-query';

describe('buildAppendQuery', () => {
  it('binds the id and the data in order and scopes the next sort order to the placeholder of the scope column', () => {
    const { sql, values } = buildAppendQuery(
      'widgets',
      'id-1',
      { name: 'one', parent_id: 'p-1' },
      'parent_id',
    );

    expect(sql).toBe(
      'INSERT INTO widgets (id, name, parent_id, sort_order) SELECT $1, $2, $3, COALESCE(MAX(sort_order), -1) + 1 FROM widgets WHERE parent_id = $3',
    );
    expect(values).toEqual(['id-1', 'one', 'p-1']);
  });
});
