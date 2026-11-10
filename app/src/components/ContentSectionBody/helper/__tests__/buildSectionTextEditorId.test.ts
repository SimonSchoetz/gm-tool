import { describe, expect, it } from 'vitest';
import { buildSectionTextEditorId } from '../buildSectionTextEditorId';

describe('buildSectionTextEditorId', () => {
  it('ends in read for a read-only editor', () => {
    expect(buildSectionTextEditorId('content-section', 's1', true)).toBe(
      'content-section-s1-read',
    );
  });

  it('ends in edit for an editable editor', () => {
    expect(buildSectionTextEditorId('basic-stat-block', 's1', false)).toBe(
      'basic-stat-block-s1-edit',
    );
  });
});
