import { describe, it, expect } from 'vitest';
import { buildCreateManyQuery } from '../build-create-many-query';

describe('buildCreateManyQuery', () => {
  it('continues the placeholders across rows and flattens the values row by row with the id first', () => {
    const { sql, values } = buildCreateManyQuery('widgets', [
      { id: 'id-1', data: { name: 'one', size: 1 } },
      { id: 'id-2', data: { name: 'two', size: 2 } },
    ]);

    expect(sql).toBe(
      'INSERT INTO widgets (id, name, size) VALUES ($1, $2, $3), ($4, $5, $6)',
    );
    expect(values).toEqual(['id-1', 'one', 1, 'id-2', 'two', 2]);
  });

  it('builds a single-row insert for one row', () => {
    const { sql, values } = buildCreateManyQuery('widgets', [
      { id: 'id-1', data: { name: 'one' } },
    ]);

    expect(sql).toBe('INSERT INTO widgets (id, name) VALUES ($1, $2)');
    expect(values).toEqual(['id-1', 'one']);
  });

  it('keeps a null value as null', () => {
    const { values } = buildCreateManyQuery('widgets', [
      { id: 'id-1', data: { name: null } },
    ]);

    expect(values).toEqual(['id-1', null]);
  });

  it('throws when a row has other keys than the first row', () => {
    expect(() =>
      buildCreateManyQuery<Record<string, string>>('widgets', [
        { id: 'id-1', data: { name: 'one' } },
        { id: 'id-2', data: { title: 'two' } },
      ]),
    ).toThrow(/^Every row must have the same keys in the same order$/);
  });

  it('throws when a row has the first row’s keys in another order', () => {
    expect(() =>
      buildCreateManyQuery<Record<string, string>>('widgets', [
        { id: 'id-1', data: { name: 'one', size: 'a' } },
        { id: 'id-2', data: { size: 'b', name: 'two' } },
      ]),
    ).toThrow(/^Every row must have the same keys in the same order$/);
  });

  it('throws for an empty rows list', () => {
    expect(() => buildCreateManyQuery('widgets', [])).toThrow(
      /^At least one row is required$/,
    );
  });
});
