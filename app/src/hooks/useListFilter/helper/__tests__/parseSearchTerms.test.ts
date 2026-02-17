import { describe, it, expect } from 'vitest';
import { parseSearchTerms } from '../parseSearchTerms';

describe('parseSearchTerms', () => {
  it('should return empty array for empty string', () => {
    expect(parseSearchTerms('')).toEqual([]);
  });

  it('should return empty array for whitespace only', () => {
    expect(parseSearchTerms('   ')).toEqual([]);
  });

  it('should parse single term', () => {
    expect(parseSearchTerms('goblin')).toEqual(['goblin']);
  });

  it('should lowercase terms', () => {
    expect(parseSearchTerms('Goblin')).toEqual(['goblin']);
  });

  it('should trim whitespace from terms', () => {
    expect(parseSearchTerms('  goblin  ')).toEqual(['goblin']);
  });

  it('should split multiple terms by comma', () => {
    expect(parseSearchTerms('goblin,carpenter')).toEqual([
      'goblin',
      'carpenter',
    ]);
  });

  it('should trim whitespace around comma-separated terms', () => {
    expect(parseSearchTerms('goblin, carpenter')).toEqual([
      'goblin',
      'carpenter',
    ]);
  });

  it('should filter out empty terms from trailing comma', () => {
    expect(parseSearchTerms('goblin,')).toEqual(['goblin']);
  });

  it('should filter out empty terms from consecutive commas', () => {
    expect(parseSearchTerms('goblin,,carpenter')).toEqual([
      'goblin',
      'carpenter',
    ]);
  });

  it('should handle three or more terms', () => {
    expect(parseSearchTerms('goblin,carpenter,Ironforge')).toEqual([
      'goblin',
      'carpenter',
      'ironforge',
    ]);
  });
});
