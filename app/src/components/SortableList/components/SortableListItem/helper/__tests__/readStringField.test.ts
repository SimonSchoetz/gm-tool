import { describe, expect, it } from 'vitest';
import { readStringField } from '../readStringField';

describe('readStringField', () => {
  it('returns a string field as it is', () => {
    expect(readStringField({ name: 'Goblin' }, 'name')).toBe('Goblin');
  });

  it('returns an empty string for a field that is missing, null or not a string', () => {
    expect(readStringField({}, 'name')).toBe('');
    expect(readStringField({ name: null }, 'name')).toBe('');
    expect(readStringField({ name: 3 }, 'name')).toBe('');
  });
});
