import { describe, it, expect } from 'vitest';
import {
  patchFiveEStatBlockContent,
  readFiveEStatBlockContent,
} from '../fiveEStatBlockContent';
import { assertValidContentSectionContent } from '../contentSectionContentSchemas';

describe('assertValidContentSectionContent', () => {
  it('accepts non-JSON content for a type without a content schema', () => {
    expect(() => {
      assertValidContentSectionContent('text', 'not json');
    }).not.toThrow();
  });

  it('accepts a valid basic stat block envelope', () => {
    const content = JSON.stringify({
      basicStatBlock: { hp: 7 },
      textEditor: '',
    });
    expect(() => {
      assertValidContentSectionContent('basic-stat-block', content);
    }).not.toThrow();
  });

  it('throws on a basic stat block envelope that fails its schema', () => {
    const content = JSON.stringify({
      basicStatBlock: { hp: 1.5 },
      textEditor: '',
    });
    expect(() => {
      assertValidContentSectionContent('basic-stat-block', content);
    }).toThrow();
  });

  it('throws on malformed JSON for a type with a content schema', () => {
    expect(() => {
      assertValidContentSectionContent('basic-stat-block', 'not json');
    }).toThrow();
  });

  it('accepts the content the 5e patch writes', () => {
    expect(() => {
      assertValidContentSectionContent(
        '5e-stat-block',
        patchFiveEStatBlockContent(null, 'hp', 7),
      );
    }).not.toThrow();
  });

  it('throws on a 5e envelope whose hp is not a whole number', () => {
    const content = JSON.stringify({
      fiveEStatBlock: {
        ...readFiveEStatBlockContent(null).fiveEStatBlock,
        hp: 1.5,
      },
    });
    expect(() => {
      assertValidContentSectionContent('5e-stat-block', content);
    }).toThrow();
  });

  it('throws on non-JSON for the 5e type', () => {
    expect(() => {
      assertValidContentSectionContent('5e-stat-block', 'not json');
    }).toThrow();
  });
});
