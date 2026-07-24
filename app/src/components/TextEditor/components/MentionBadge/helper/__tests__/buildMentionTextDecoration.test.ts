import { describe, it, expect } from 'vitest';
import { buildMentionTextDecoration } from '../buildMentionTextDecoration';

describe('buildMentionTextDecoration', () => {
  it('returns none when no formats are active', () => {
    expect(buildMentionTextDecoration([])).toBe('none');
  });

  it('returns underline when only underline is active', () => {
    expect(buildMentionTextDecoration(['underline'])).toBe('underline');
  });

  it('returns line-through when only strikethrough is active', () => {
    expect(buildMentionTextDecoration(['strikethrough'])).toBe('line-through');
  });

  it('combines both when underline and strikethrough are both active', () => {
    expect(buildMentionTextDecoration(['strikethrough', 'underline'])).toBe(
      'underline line-through',
    );
  });

  it('ignores formats that do not map to text-decoration', () => {
    expect(buildMentionTextDecoration(['bold', 'italic'])).toBe('none');
  });
});
