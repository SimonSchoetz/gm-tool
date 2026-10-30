import { describe, expect, it } from 'vitest';
import {
  patchBasicStatBlockContent,
  type BaseEntityContentSectionType,
} from '@domain';
import { describeHpNotSetHint } from '../describeHpNotSetHint';

const basicBlock = (hp: number | null) => ({
  type: 'basic-stat-block' as BaseEntityContentSectionType,
  content: patchBasicStatBlockContent(null, { hp }),
});

describe('describeHpNotSetHint', () => {
  it('gives the plain sentence without a linked entity, even when the sections hold two stat blocks', () => {
    expect(
      describeHpNotSetHint({
        entityLinked: false,
        sectionsLoading: false,
        sections: [basicBlock(5), basicBlock(6)],
      }),
    ).toBe('HP is not set. Set max HP in the Actions tab.');
  });

  it('gives nothing while the sections of a linked entity load', () => {
    expect(
      describeHpNotSetHint({
        entityLinked: true,
        sectionsLoading: true,
        sections: [],
      }),
    ).toBeNull();
  });

  it.each([
    [
      'no stat block with an HP value',
      [basicBlock(null)],
      'HP is not set: the entity has no stat block with an HP value. Set max HP in the Actions tab.',
    ],
    [
      'several stat blocks',
      [basicBlock(5), basicBlock(6)],
      'HP is not set: the entity has more than one stat block. Set max HP in the Actions tab.',
    ],
    [
      'a stat block that got its HP after the add',
      [basicBlock(5)],
      'HP is not set. Set max HP in the Actions tab.',
    ],
  ])('gives its own sentence for %s', (_label, sections, expected) => {
    expect(
      describeHpNotSetHint({
        entityLinked: true,
        sectionsLoading: false,
        sections,
      }),
    ).toBe(expected);
  });
});
