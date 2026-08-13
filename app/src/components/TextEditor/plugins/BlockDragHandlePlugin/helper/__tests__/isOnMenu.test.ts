import { describe, it, expect } from 'vitest';
import { isOnMenu } from '../isOnMenu';

describe('isOnMenu', () => {
  it('returns true when the element is inside the drag handle', () => {
    const handle = document.createElement('div');
    handle.className = 'block-drag-handle';
    const child = document.createElement('svg');
    handle.appendChild(child);

    expect(isOnMenu(child)).toBe(true);
  });

  it('returns false when the element is outside the drag handle', () => {
    const element = document.createElement('div');

    expect(isOnMenu(element)).toBe(false);
  });
});
