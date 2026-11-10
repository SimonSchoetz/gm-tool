import { describe, expect, it } from 'vitest';
import { getInputPlaceholder } from '../getInputPlaceholder';

describe('getInputPlaceholder', () => {
  it('shows no placeholder in a read-only field', () => {
    expect(getInputPlaceholder(true, 'AC')).toBeNull();
  });

  it('shows the placeholder in an editable field', () => {
    expect(getInputPlaceholder(false, 'AC')).toBe('AC');
  });
});
