import { describe, it, expect } from 'vitest';
import { contentSectionLabel } from '../contentSectionTypeLabels';

describe('contentSectionLabel', () => {
  it("returns the section's name when it has one", () => {
    expect(contentSectionLabel('Goblin stats', '5e-stat-block')).toBe(
      'Goblin stats',
    );
  });

  it('falls back to the type label for an empty name', () => {
    expect(contentSectionLabel('', 'text')).toBe('Text');
  });

  it('falls back to the type label for a missing name', () => {
    expect(contentSectionLabel(null, '5e-stat-block')).toBe('5e Stat Block');
  });
});
