import { describe, expect, it } from 'vitest';
import { buildItemGridTemplate } from '../buildItemGridTemplate';

const columns = [
  { key: 'name', width: 111 },
  { key: 'created_at', width: 222 },
];

describe('buildItemGridTemplate', () => {
  it('sizes the columns by their configured widths when no column is being dragged', () => {
    expect(buildItemGridTemplate(columns, null)).toBe(
      '111px minmax(222px, 1fr)',
    );
  });

  it('sizes the columns by the widths of a drag in progress instead of the configured ones', () => {
    expect(buildItemGridTemplate(columns, { name: 333, created_at: 444 })).toBe(
      '333px minmax(444px, 1fr)',
    );
  });
});
