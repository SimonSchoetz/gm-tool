import { describe, expect, it, vi } from 'vitest';
import { blurOnEnter } from '../blurOnEnter';

const keyDownOn = (key: string) => {
  const blur = vi.fn();
  const event = { key, currentTarget: { blur } };
  blurOnEnter(event as unknown as React.KeyboardEvent<HTMLInputElement>);
  return blur;
};

describe('blurOnEnter', () => {
  it('blurs the input when Enter is pressed', () => {
    expect(keyDownOn('Enter')).toHaveBeenCalledTimes(1);
  });

  it('keeps the focus on any other key', () => {
    expect(keyDownOn('a')).not.toHaveBeenCalled();
  });
});
