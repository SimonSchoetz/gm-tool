import { describe, it, expect } from 'vitest';
import { parseSafeEditorState } from '../parseSafeEditorState';

describe('parseSafeEditorState', () => {
  it('returns null for invalid JSON', () => {
    expect(parseSafeEditorState('not-json')).toBe(null);
  });

  it('returns null for empty root children', () => {
    const state = JSON.stringify({ root: { children: [] } });
    expect(parseSafeEditorState(state)).toBe(null);
  });

  it('returns null when root is missing', () => {
    expect(parseSafeEditorState('{}')).toBe(null);
  });

  it('returns null when children array is missing', () => {
    expect(parseSafeEditorState('{"root":{}}')).toBe(null);
  });

  it('returns the original string when root has children', () => {
    const state = JSON.stringify({
      root: { children: [{ type: 'paragraph' }] },
    });
    expect(parseSafeEditorState(state)).toBe(state);
  });
});
