import { describe, it, expect } from 'vitest';
import { applyTypographicRuleAtCaret } from '../applyTypographicRuleAtCaret';

describe('applyTypographicRuleAtCaret', () => {
  it('returns null when the caret is null', () => {
    expect(applyTypographicRuleAtCaret('a->', 'a-', null)).toBeNull();
  });

  it('returns null when more than one character was inserted', () => {
    expect(applyTypographicRuleAtCaret('a-->', '', 4)).toBeNull();
  });

  it('returns null when a character was deleted', () => {
    expect(applyTypographicRuleAtCaret('a-', 'a->', 2)).toBeNull();
  });

  it('returns null when no rule matches the text before the caret', () => {
    expect(applyTypographicRuleAtCaret('ab', 'a', 2)).toBeNull();
  });

  it('replaces "->" with "→" and places the caret after the arrow', () => {
    expect(applyTypographicRuleAtCaret('a->', 'a-', 3)).toEqual({
      value: 'a→',
      caret: 2,
    });
  });

  it('replaces "<-" with "←" and places the caret after the arrow', () => {
    expect(applyTypographicRuleAtCaret('a<-', 'a<', 3)).toEqual({
      value: 'a←',
      caret: 2,
    });
  });

  it('replaces "--" with "—" and places the caret after the em dash', () => {
    expect(applyTypographicRuleAtCaret('a--', 'a-', 3)).toEqual({
      value: 'a—',
      caret: 2,
    });
  });

  it('replaces "—>" with "→", the composition step that makes "-->" reachable', () => {
    expect(applyTypographicRuleAtCaret('a—>', 'a—', 3)).toEqual({
      value: 'a→',
      caret: 2,
    });
  });

  it('preserves text after the caret when replacing mid-string', () => {
    expect(applyTypographicRuleAtCaret('a-->tail', 'a->tail', 3)).toEqual({
      value: 'a—>tail',
      caret: 2,
    });
  });
});
