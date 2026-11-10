import { describe, expect, it } from 'vitest';
import { getEnableButtonLabel } from '../getEnableButtonLabel';

describe('getEnableButtonLabel', () => {
  it('reads Enabled for an enabled setting', () => {
    expect(getEnableButtonLabel(true)).toBe('Enabled');
  });

  it('reads Disabled for a disabled setting', () => {
    expect(getEnableButtonLabel(false)).toBe('Disabled');
  });
});
