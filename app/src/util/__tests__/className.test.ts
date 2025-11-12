import { describe, it, expect } from 'vitest';
import { cn } from '../className';

describe('cn utility', () => {
  it('should join multiple class names with spaces', () => {
    expect(cn('class1', 'class2', 'class3')).toBe('class1 class2 class3');
  });

  it('should filter out falsy values', () => {
    expect(cn('class1', false, 'class2', null, 'class3', undefined)).toBe(
      'class1 class2 class3'
    );
  });

  it('should handle empty input', () => {
    expect(cn()).toBe('');
  });

  it('should handle only falsy values', () => {
    expect(cn(false, null, undefined, '')).toBe('');
  });

  it('should handle numbers', () => {
    expect(cn('class1', 0, 'class2', 1, 'class3')).toBe('class1 class2 1 class3');
  });

  it('should handle conditional classes', () => {
    const isActive = true;
    const isDisabled = false;

    expect(cn('base', isActive && 'active', isDisabled && 'disabled')).toBe(
      'base active'
    );
  });

  it('should handle single class name', () => {
    expect(cn('single-class')).toBe('single-class');
  });

  it('should trim extra spaces by nature of join', () => {
    expect(cn('class1', '', 'class2')).toBe('class1 class2');
  });
});
