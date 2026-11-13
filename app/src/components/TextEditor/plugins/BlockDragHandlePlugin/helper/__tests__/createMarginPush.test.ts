import { describe, expect, it } from 'vitest';
import { createMarginPush } from '../createMarginPush';

const gapOf = (element: HTMLElement, margin: 'marginTop' | 'marginBottom') => ({
  gap: { element, margin },
});

describe('createMarginPush', () => {
  it('opens the margin the target names on its element', () => {
    const { push } = createMarginPush();
    const element = document.createElement('div');

    push(gapOf(element, 'marginBottom'));

    expect(element.style.marginBottom).toBe('var(--spacing-xl)');
    expect(element.style.marginTop).toBe('');
  });

  it('keeps the margin it opened when the same target is pushed again', () => {
    const { push } = createMarginPush();
    const element = document.createElement('div');
    push(gapOf(element, 'marginTop'));
    element.style.marginTop = 'var(--spacing-xs)';

    push(gapOf(element, 'marginTop'));

    expect(element.style.marginTop).toBe('var(--spacing-xs)');
  });

  it('puts the previous margin back when another element or another margin is pushed', () => {
    const { push } = createMarginPush();
    const first = document.createElement('div');
    const second = document.createElement('div');

    push(gapOf(first, 'marginBottom'));
    push(gapOf(second, 'marginTop'));
    expect(first.style.marginBottom).toBe('');
    expect(second.style.marginTop).toBe('var(--spacing-xl)');

    push(gapOf(second, 'marginBottom'));
    expect(second.style.marginTop).toBe('');
    expect(second.style.marginBottom).toBe('var(--spacing-xl)');
  });

  it('puts the margin back on clear, and clearing again does nothing', () => {
    const { push, clear } = createMarginPush();
    const element = document.createElement('div');
    push(gapOf(element, 'marginBottom'));

    clear();
    element.style.marginBottom = 'var(--spacing-sm)';
    clear();

    expect(element.style.marginBottom).toBe('var(--spacing-sm)');
  });
});
