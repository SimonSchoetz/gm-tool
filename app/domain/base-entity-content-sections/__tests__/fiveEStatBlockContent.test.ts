import { describe, it, expect } from 'vitest';
import type {
  FiveEStatBlockContent,
  FiveEStatBlockNumberKey,
  FiveEStatBlockTextKey,
} from '../fiveEStatBlockContent';
import {
  patchFiveEStatBlockContent,
  readFiveEStatBlockContent,
} from '../fiveEStatBlockContent';

const emptyBlock: FiveEStatBlockContent['fiveEStatBlock'] =
  readFiveEStatBlockContent(null).fiveEStatBlock;
const numberKey: FiveEStatBlockNumberKey = 'hp';
const textKey: FiveEStatBlockTextKey = 'senses';

describe('readFiveEStatBlockContent', () => {
  it('reads null content as every number null and every text empty', () => {
    const { fiveEStatBlock } = readFiveEStatBlockContent(null);
    expect(fiveEStatBlock.hp).toBeNull();
    expect(fiveEStatBlock.strSave).toBeNull();
    expect(fiveEStatBlock.speed).toBe('');
    expect(fiveEStatBlock.languages).toBe('');
  });

  it('reads unparseable legacy text as empty instead of throwing', () => {
    expect(readFiveEStatBlockContent('old free text')).toEqual(
      readFiveEStatBlockContent(null),
    );
  });

  it('reads Lexical editor JSON as empty instead of throwing', () => {
    const lexical = JSON.stringify({ root: { children: [], type: 'root' } });
    expect(readFiveEStatBlockContent(lexical)).toEqual(
      readFiveEStatBlockContent(null),
    );
  });

  it('reads back every stored field', () => {
    const stored = JSON.stringify({
      fiveEStatBlock: {
        ...emptyBlock,
        hp: 45,
        chaSave: -1,
        speed: '30 ft.',
        languages: 'Common',
      },
    });
    const { fiveEStatBlock } = readFiveEStatBlockContent(stored);
    expect(fiveEStatBlock).toEqual({
      ...emptyBlock,
      hp: 45,
      chaSave: -1,
      speed: '30 ft.',
      languages: 'Common',
    });
  });
});

describe('patchFiveEStatBlockContent', () => {
  it('replaces legacy content, leaving every other field empty', () => {
    const patched = patchFiveEStatBlockContent('old free text', 'ac', 15);
    expect(readFiveEStatBlockContent(patched).fiveEStatBlock).toEqual({
      ...emptyBlock,
      ac: 15,
    });
  });

  it('keeps the other fields when one number key and one text key are patched in turn', () => {
    const afterNumber = patchFiveEStatBlockContent(null, numberKey, 7);
    const afterText = patchFiveEStatBlockContent(
      afterNumber,
      textKey,
      'Darkvision',
    );
    expect(readFiveEStatBlockContent(afterText).fiveEStatBlock).toEqual({
      ...emptyBlock,
      hp: 7,
      senses: 'Darkvision',
    });
  });
});
