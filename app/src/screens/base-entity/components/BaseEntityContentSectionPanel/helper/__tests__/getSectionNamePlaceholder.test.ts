import { contentSectionTypeLabel } from '@domain';
import { describe, expect, it } from 'vitest';
import { getSectionNamePlaceholder } from '../getSectionNamePlaceholder';

describe('getSectionNamePlaceholder', () => {
  it('labels the name input of a section with its type', () => {
    expect(getSectionNamePlaceholder('basic-stat-block')).toBe(
      contentSectionTypeLabel('basic-stat-block'),
    );
  });

  it('gives no placeholder when no section is selected', () => {
    expect(getSectionNamePlaceholder(null)).toBe('');
  });
});
