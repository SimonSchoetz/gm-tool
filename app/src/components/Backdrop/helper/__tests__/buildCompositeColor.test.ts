import { describe, it, expect, vi, afterEach } from 'vitest';
import { buildCompositeColor } from '../buildCompositeColor';

describe('buildCompositeColor', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('computes composite color from bg and primary rgb variables', () => {
    const cssVariables = new Map([
      ['--color-bg-rgb', '3, 19, 34'],
      ['--color-primary-rgb', '0, 212, 255'],
    ]);
    vi.spyOn(window, 'getComputedStyle').mockReturnValue({
      getPropertyValue: (prop: string) => cssVariables.get(prop) ?? '',
    } as unknown as CSSStyleDeclaration);

    expect(buildCompositeColor()).toBe('rgb(3, 40, 60)');
    // round(3 + 0*0.1) = 3, round(19 + 21.2) = 40, round(34 + 25.5) = 60
  });

  it('rounds 0.5 to 1 (standard rounding)', () => {
    const cssVariables = new Map([
      ['--color-bg-rgb', '0, 0, 0'],
      ['--color-primary-rgb', '5, 5, 5'],
    ]);
    vi.spyOn(window, 'getComputedStyle').mockReturnValue({
      getPropertyValue: (prop: string) => cssVariables.get(prop) ?? '',
    } as unknown as CSSStyleDeclaration);

    expect(buildCompositeColor()).toBe('rgb(1, 1, 1)');
    // round(0 + 5*0.1) = round(0.5) = 1
  });
});
