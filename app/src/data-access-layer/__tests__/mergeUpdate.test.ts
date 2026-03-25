import { describe, expect, it } from 'vitest';

import { mergeUpdate } from '../mergeUpdate';

describe('mergeUpdate', () => {
  it('merges defined values from patch into base', () => {
    const base = { name: 'Alice', count: 1 };
    const result = mergeUpdate(base, { name: 'Bob' });
    expect(result).toEqual({ name: 'Bob', count: 1 });
  });

  it('skips keys where patch value is undefined', () => {
    const base = { name: 'Alice', count: 1 };
    const result = mergeUpdate(base, { name: undefined });
    expect(result.name).toBe('Alice');
  });

  it('leaves keys absent from patch unchanged', () => {
    const base = { name: 'Alice', count: 1 };
    const result = mergeUpdate(base, { count: 5 });
    expect(result.name).toBe('Alice');
    expect(result.count).toBe(5);
  });

  it('works correctly when patch is empty {}', () => {
    const base = { name: 'Alice', count: 1 };
    const result = mergeUpdate(base, {});
    expect(result).toEqual({ name: 'Alice', count: 1 });
  });
});
