import { describe, expect, it } from 'vitest';
import { getIconIntensity } from '../getIconIntensity';

describe('getIconIntensity', () => {
  it('brightens the icon panel of the active row', () => {
    expect(getIconIntensity(true)).toBe('bright');
  });

  it('dims the icon panel of a row that is not active', () => {
    expect(getIconIntensity(false)).toBe('dim');
  });

  it('dims the icon panel of a row that omits isActive', () => {
    expect(getIconIntensity()).toBe('dim');
  });
});
