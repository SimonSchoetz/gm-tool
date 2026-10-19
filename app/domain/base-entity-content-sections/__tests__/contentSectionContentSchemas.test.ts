import { describe, it, expect } from 'vitest';
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
});
