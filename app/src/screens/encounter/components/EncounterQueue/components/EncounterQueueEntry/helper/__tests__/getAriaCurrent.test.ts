import { describe, expect, it } from 'vitest';
import { getAriaCurrent } from '../getAriaCurrent';

describe('getAriaCurrent', () => {
  it('marks a selected entry as the current one', () => {
    expect(getAriaCurrent(true)).toBe('true');
  });

  it('leaves an unselected entry unmarked', () => {
    expect(getAriaCurrent(false)).toBeNull();
  });
});
