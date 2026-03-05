import { describe, it, expect } from 'vitest';
import { buildGridTemplate } from '../buildGridTemplate';

describe('buildGridTemplate', () => {
  it('formats all columns as fixed px except the last, which uses minmax', () => {
    const result = buildGridTemplate(['a', 'b', 'c'], { a: 100, b: 200, c: 300 });
    expect(result).toBe('100px 200px minmax(300px, 1fr)');
  });

  it('uses DEFAULT_COLUMN_WIDTH (150) for columns without a width entry', () => {
    const result = buildGridTemplate(['a', 'b'], { a: 80 });
    expect(result).toBe('80px minmax(150px, 1fr)');
  });

  it('applies minmax to the only column when given a single-column list', () => {
    const result = buildGridTemplate(['only'], { only: 200 });
    expect(result).toBe('minmax(200px, 1fr)');
  });

  it('returns an empty string for an empty column list', () => {
    const result = buildGridTemplate([], {});
    expect(result).toBe('');
  });

  it('falls back to DEFAULT_COLUMN_WIDTH for every column when widths map is empty', () => {
    const result = buildGridTemplate(['x', 'y'], {});
    expect(result).toBe('150px minmax(150px, 1fr)');
  });
});
