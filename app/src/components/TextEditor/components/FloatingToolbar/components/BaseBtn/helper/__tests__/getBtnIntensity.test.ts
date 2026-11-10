import { describe, expect, it } from 'vitest';
import { getBtnIntensity } from '../getBtnIntensity';

describe('getBtnIntensity', () => {
  it('brightens the panel of an active button', () => {
    expect(getBtnIntensity(true)).toBe('bright');
  });

  it('switches the panel of an inactive button off', () => {
    expect(getBtnIntensity(false)).toBe('off');
  });
});
