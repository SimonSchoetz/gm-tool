import { describe, it, expect, afterEach, vi } from 'vitest';
import { getColor } from '../getColor';

describe('getColor', () => {
  afterEach(() => {
    vi.restoreAllMocks();
    document.documentElement.style.removeProperty('--test-color');
    document.documentElement.style.removeProperty('--other-color');
  });

  it('returns the value of the named custom property of the document without the whitespace around it', () => {
    document.documentElement.style.setProperty('--test-color', '  #112233  ');
    document.documentElement.style.setProperty('--other-color', '#ffffff');

    expect(getColor('--test-color')).toBe('#112233');
  });

  it('returns an empty string for a custom property that is not set', () => {
    expect(getColor('--test-color')).toBe('');
  });

  it('strips the whitespace the browser keeps around a custom property value', () => {
    vi.spyOn(window, 'getComputedStyle').mockReturnValue({
      getPropertyValue: () => ' #112233 ',
    } as unknown as CSSStyleDeclaration);

    expect(getColor('--test-color')).toBe('#112233');
  });
});
