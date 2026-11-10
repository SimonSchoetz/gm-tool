import { describe, expect, it } from 'vitest';
import { getImageAriaLabel } from '../getImageAriaLabel';

describe('getImageAriaLabel', () => {
  it('labels a grey image as greyed out', () => {
    expect(getImageAriaLabel('grey')).toBe('Greyed-out image');
  });

  it.each(['tint', 'plain'] as const)(
    'leaves a %s image unlabelled',
    (look) => {
      expect(getImageAriaLabel(look)).toBeNull();
    },
  );
});
