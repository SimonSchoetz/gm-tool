import { describe, expect, it } from 'vitest';
import { isHiddenTextField } from '../isHiddenTextField';

describe('isHiddenTextField', () => {
  it.each(['', '   ', ' \t '])(
    'hides a read-only field holding blank text %j',
    (savedValue) => {
      expect(isHiddenTextField(true, savedValue)).toBe(true);
    },
  );

  it.each(['30 ft.', ' 30 ft. '])(
    'shows a read-only field holding text %j',
    (savedValue) => {
      expect(isHiddenTextField(true, savedValue)).toBe(false);
    },
  );

  it.each(['', '   '])(
    'shows an editable field holding blank text %j',
    (savedValue) => {
      expect(isHiddenTextField(false, savedValue)).toBe(false);
    },
  );
});
