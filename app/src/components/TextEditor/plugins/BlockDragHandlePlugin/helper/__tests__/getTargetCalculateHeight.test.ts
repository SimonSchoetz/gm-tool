import { describe, it, expect, afterEach } from 'vitest';
import { getTargetCalculateHeight } from '../getTargetCalculateHeight';

describe('getTargetCalculateHeight', () => {
  afterEach(() => {
    document.body.innerHTML = '';
  });

  it('returns the parsed line-height when it resolves to a pixel value', () => {
    const element = document.createElement('div');
    element.style.lineHeight = '24px';
    document.body.appendChild(element);

    expect(getTargetCalculateHeight(element)).toBe(24);
  });

  it('falls back to the element bounding rect height when line-height is not parseable', () => {
    const element = document.createElement('div');
    document.body.appendChild(element);

    expect(getTargetCalculateHeight(element)).toBe(
      element.getBoundingClientRect().height,
    );
  });
});
