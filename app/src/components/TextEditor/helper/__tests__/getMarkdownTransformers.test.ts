import { CHECK_LIST, ORDERED_LIST, UNORDERED_LIST } from '@lexical/markdown';
import { describe, expect, it } from 'vitest';
import { TYPOGRAPHIC_TRANSFORMERS } from '../../typographicTransformers';
import { getMarkdownTransformers } from '../getMarkdownTransformers';

describe('getMarkdownTransformers', () => {
  it('gives a document the list and checklist shortcuts before the typographic ones', () => {
    expect(getMarkdownTransformers(true)).toEqual([
      UNORDERED_LIST,
      ORDERED_LIST,
      CHECK_LIST,
      ...TYPOGRAPHIC_TRANSFORMERS,
    ]);
  });

  it('gives a message only the typographic shortcuts', () => {
    expect(getMarkdownTransformers(false)).toEqual(TYPOGRAPHIC_TRANSFORMERS);
  });
});
