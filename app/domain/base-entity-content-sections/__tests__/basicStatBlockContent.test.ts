import { describe, it, expect } from 'vitest';
import {
  parseBasicStatBlockContent,
  patchBasicStatBlockContent,
} from '../basicStatBlockContent';

const storedContent = JSON.stringify({
  basicStatBlock: { hp: 12 },
  textEditor: 'editor state',
});

describe('parseBasicStatBlockContent', () => {
  it("reads a new section's null content as an empty HP and empty text", () => {
    expect(parseBasicStatBlockContent(null)).toEqual({
      basicStatBlock: { hp: null },
      textEditor: '',
    });
  });

  it('parses stored content to its HP and text instead of the empty value', () => {
    expect(parseBasicStatBlockContent(storedContent)).toEqual({
      basicStatBlock: { hp: 12 },
      textEditor: 'editor state',
    });
  });

  it('throws on malformed stored JSON', () => {
    expect(() => parseBasicStatBlockContent('{"basicStatBlock":')).toThrow();
  });

  it('throws on a well-formed envelope whose HP is not a whole number', () => {
    const content = JSON.stringify({
      basicStatBlock: { hp: 1.5 },
      textEditor: '',
    });
    expect(() => parseBasicStatBlockContent(content)).toThrow();
  });
});

describe('patchBasicStatBlockContent', () => {
  it('replaces HP and keeps the existing text', () => {
    const patched = patchBasicStatBlockContent(storedContent, { hp: -3 });
    expect(parseBasicStatBlockContent(patched)).toEqual({
      basicStatBlock: { hp: -3 },
      textEditor: 'editor state',
    });
  });

  it('replaces the text and keeps the existing HP', () => {
    const patched = patchBasicStatBlockContent(storedContent, {
      textEditor: 'new state',
    });
    expect(parseBasicStatBlockContent(patched)).toEqual({
      basicStatBlock: { hp: 12 },
      textEditor: 'new state',
    });
  });

  it("builds a parseable envelope from a new section's null content", () => {
    const patched = patchBasicStatBlockContent(null, { hp: 4 });
    expect(parseBasicStatBlockContent(patched)).toEqual({
      basicStatBlock: { hp: 4 },
      textEditor: '',
    });
  });
});
