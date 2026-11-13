import { describe, expect, it } from 'vitest';
import { plainTextToBlocks } from '../plainTextToBlocks';
import {
  inEditor,
  makeEditor,
} from '../../../__tests__/support/toggleFixtures';

const blocksOf = (text: string) =>
  inEditor(makeEditor(), () =>
    plainTextToBlocks(text).map((block) => ({
      type: block.getType(),
      text: block.getTextContent(),
      children: block.getChildrenSize(),
    })),
  );

describe('plainTextToBlocks', () => {
  it('makes one paragraph per line, in order', () => {
    expect(blocksOf('one\ntwo\nthree')).toEqual([
      { type: 'paragraph', text: 'one', children: 1 },
      { type: 'paragraph', text: 'two', children: 1 },
      { type: 'paragraph', text: 'three', children: 1 },
    ]);
  });

  it('reads a carriage return followed by a line feed, and a lone carriage return, as one line break each', () => {
    expect(blocksOf('one\r\ntwo\rthree').map(({ text }) => text)).toEqual([
      'one',
      'two',
      'three',
    ]);
  });

  it('keeps a blank line as an empty paragraph with no children', () => {
    expect(blocksOf('one\n\ntwo')).toEqual([
      { type: 'paragraph', text: 'one', children: 1 },
      { type: 'paragraph', text: '', children: 0 },
      { type: 'paragraph', text: 'two', children: 1 },
    ]);
  });

  it('keeps leading spaces and tabs of a line', () => {
    expect(blocksOf('  indented\n\ttabbed').map(({ text }) => text)).toEqual([
      '  indented',
      '\ttabbed',
    ]);
  });

  it('makes one paragraph of a text with no line break', () => {
    expect(blocksOf('single')).toEqual([
      { type: 'paragraph', text: 'single', children: 1 },
    ]);
  });
});
