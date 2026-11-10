import { describe, expect, it } from 'vitest';
import { getAnchorHeight } from '../getAnchorHeight';

describe('getAnchorHeight', () => {
  it('is null when no block is hovered', () => {
    expect(getAnchorHeight(null)).toBeNull();
  });

  it('is the hovered block line height', () => {
    const element = document.createElement('p');
    element.style.lineHeight = '24px';
    document.body.append(element);
    expect(getAnchorHeight(element)).toBe(24);
    element.remove();
  });
});
