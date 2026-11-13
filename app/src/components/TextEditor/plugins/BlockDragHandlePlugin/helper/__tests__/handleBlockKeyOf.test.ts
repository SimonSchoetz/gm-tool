import { describe, expect, it } from 'vitest';
import { BLOCK_KEY_ATTRIBUTE, handleBlockKeyOf } from '../handleBlockKeyOf';

const handleWithIcon = () => {
  const handle = document.createElement('div');
  handle.setAttribute(BLOCK_KEY_ATTRIBUTE, '42');
  const icon = document.createElement('span');
  handle.append(icon);
  return { handle, icon };
};

describe('handleBlockKeyOf', () => {
  it('gives the key a handle carries, for the handle itself and for an element inside it', () => {
    const { handle, icon } = handleWithIcon();

    expect(handleBlockKeyOf(handle)).toBe('42');
    expect(handleBlockKeyOf(icon)).toBe('42');
  });

  it('gives null for an element outside every handle and for no target', () => {
    expect(handleBlockKeyOf(document.createElement('div'))).toBeNull();
    expect(handleBlockKeyOf(null)).toBeNull();
  });
});
