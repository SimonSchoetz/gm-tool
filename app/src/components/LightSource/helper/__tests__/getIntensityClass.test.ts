import { describe, expect, it } from 'vitest';
import { getIntensityClass } from '../getIntensityClass';

describe('getIntensityClass', () => {
  it('maps bright and dim to their classes', () => {
    expect(getIntensityClass('bright')).toBe('light-source-bright');
    expect(getIntensityClass('dim')).toBe('light-source-dim');
  });
});
