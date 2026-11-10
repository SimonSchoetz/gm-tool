import { describe, expect, it } from 'vitest';
import { formatSavedHpText } from '../formatSavedHpText';

describe('formatSavedHpText', () => {
  it('shows an empty field when no HP is saved', () => {
    expect(formatSavedHpText(null)).toBe('');
  });

  it('shows the saved HP as text', () => {
    expect(formatSavedHpText(0)).toBe('0');
    expect(formatSavedHpText(42)).toBe('42');
  });
});
