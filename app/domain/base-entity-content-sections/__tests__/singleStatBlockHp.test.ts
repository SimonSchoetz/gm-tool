import { describe, it, expect } from 'vitest';
import { patchBasicStatBlockContent } from '../basicStatBlockContent';
import { patchFiveEStatBlockContent } from '../fiveEStatBlockContent';
import { singleStatBlockHp } from '../singleStatBlockHp';

const basicBlock = (hp: number | null) => ({
  type: 'basic-stat-block',
  content: patchBasicStatBlockContent(null, { hp }),
});
const fiveEBlock = (hp: number | null) => ({
  type: '5e-stat-block',
  content: patchFiveEStatBlockContent(null, 'hp', hp),
});

describe('singleStatBlockHp', () => {
  it.each([7, 0, -3])('gives the HP %i of one Basic stat block', (hp) => {
    expect(singleStatBlockHp([basicBlock(hp)])).toBe(hp);
  });

  it('gives the HP of one 5e stat block', () => {
    expect(singleStatBlockHp([fiveEBlock(12)])).toBe(12);
  });

  it('gives null for two Basic stat blocks', () => {
    expect(singleStatBlockHp([basicBlock(5), basicBlock(6)])).toBeNull();
  });

  it('gives null for one Basic and one 5e stat block', () => {
    expect(singleStatBlockHp([basicBlock(5), fiveEBlock(6)])).toBeNull();
  });

  it('gives null for no stat block', () => {
    expect(singleStatBlockHp([])).toBeNull();
  });

  it('gives null for a stat block with an empty HP', () => {
    expect(singleStatBlockHp([basicBlock(null)])).toBeNull();
  });

  it('does not count a text section beside one stat block', () => {
    expect(
      singleStatBlockHp([
        { type: 'text', content: '{"root":{}}' },
        basicBlock(9),
      ]),
    ).toBe(9);
  });
});
