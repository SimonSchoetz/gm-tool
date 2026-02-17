import { describe, it, expect } from 'vitest';
import { allTermsMatchItem } from '../allTermsMatchItem';

const npc = {
  name: 'Brun Ironforge',
  summary: 'A dwarven carpenter',
  description: 'Brun is a skilled craftsman from the mountains.',
};

const columns = ['name', 'summary', 'description'];

describe('allTermsMatchItem', () => {
  it('should return true when all terms match across fields', () => {
    expect(allTermsMatchItem(['ironforge', 'carpenter'], npc, columns)).toBe(
      true,
    );
  });

  it('should return true for single matching term', () => {
    expect(allTermsMatchItem(['brun'], npc, columns)).toBe(true);
  });

  it('should return false when one term does not match', () => {
    expect(allTermsMatchItem(['ironforge', 'wizard'], npc, columns)).toBe(
      false,
    );
  });

  it('should return false when no terms match', () => {
    expect(allTermsMatchItem(['dragon', 'wizard'], npc, columns)).toBe(false);
  });

  it('should match case-insensitively', () => {
    expect(allTermsMatchItem(['ironforge'], npc, columns)).toBe(true);
  });

  it('should match partial strings', () => {
    expect(allTermsMatchItem(['iron', 'carp'], npc, columns)).toBe(true);
  });

  it('should only search specified columns', () => {
    expect(allTermsMatchItem(['carpenter'], npc, ['name'])).toBe(false);
  });

  it('should return true for empty terms array', () => {
    expect(allTermsMatchItem([], npc, columns)).toBe(true);
  });

  it('should handle items with missing columns gracefully', () => {
    const partial = { name: 'Brun Ironforge' };
    expect(allTermsMatchItem(['brun'], partial, columns)).toBe(true);
  });

  it('should handle non-string field values gracefully', () => {
    const withNumber = { name: 'Brun', level: 5 };
    expect(allTermsMatchItem(['5'], withNumber, ['name', 'level'])).toBe(false);
  });
});
