import { describe, it, expect } from 'vitest';
import type { BaseEntityContentSection } from '@db/base-entity-content-section';
import { readPopupSummary } from '../readPopupSummary';

const section = (
  overrides: Partial<BaseEntityContentSection>,
): BaseEntityContentSection => ({
  id: 'section-1',
  base_entity_id: 'entity-1',
  name: null,
  type: 'text',
  content: null,
  checked: 0,
  sort_order: 0,
  created_at: '2026-01-01T00:00:00.000Z',
  updated_at: '2026-01-01T00:00:00.000Z',
  ...overrides,
});

describe('readPopupSummary', () => {
  it('reads the editor text and the HP of a stat block section, not its raw JSON', () => {
    const statBlock = section({
      type: 'basic-stat-block',
      content: JSON.stringify({
        basicStatBlock: { hp: 12 },
        textEditor: 'Goblin notes',
      }),
    });

    expect(readPopupSummary(statBlock)).toEqual({
      summary: 'Goblin notes',
      hp: { value: 12 },
    });
  });

  it('keeps the HP header for a stat block whose HP is unset', () => {
    const statBlock = section({
      type: 'basic-stat-block',
      content: JSON.stringify({
        basicStatBlock: { hp: null },
        textEditor: 'Goblin notes',
      }),
    });

    expect(readPopupSummary(statBlock).hp).toEqual({ value: null });
  });

  it('reads the content of a text section without an HP header', () => {
    expect(readPopupSummary(section({ content: 'Some text' }))).toEqual({
      summary: 'Some text',
      hp: null,
    });
  });

  it('reads a text section without content as no summary', () => {
    expect(readPopupSummary(section({ content: null }))).toEqual({
      summary: null,
      hp: null,
    });
  });

  it('reads no section as no summary and no HP', () => {
    expect(readPopupSummary(null)).toEqual({ summary: null, hp: null });
  });
});
