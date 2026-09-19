import { describe, it, expect } from 'vitest';
import { parseLayoutFromRow } from '../parse-layout-row';

const validLayout = {
  searchable_columns: ['name'],
  columns: [{ key: 'name', label: 'Name', width: 250 }],
  sort_state: { column: 'name', direction: 'asc' },
};

describe('parseLayoutFromRow', () => {
  it('returns a valid stored layout without a key the layout schema does not define', () => {
    const stored = JSON.stringify({ ...validLayout, unknown_key: 'ignored' });

    expect(parseLayoutFromRow(stored)).toEqual(validLayout);
  });

  it('throws when a stored column width is null', () => {
    const stored = JSON.stringify({
      ...validLayout,
      columns: [{ key: 'name', label: 'Name', width: null }],
    });

    expect(() => parseLayoutFromRow(stored)).toThrow(
      /^Stored layout is invalid/,
    );
  });
});
