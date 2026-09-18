import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

const mockExecute = vi.fn();
const mockSelect = vi.fn();

vi.mock('@tauri-apps/plugin-sql', () => ({
  default: {
    load: vi.fn(() =>
      Promise.resolve({ execute: mockExecute, select: mockSelect }),
    ),
  },
}));

let generatedIdCounter = 0;
vi.mock('../../util', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../../util')>();
  return {
    ...actual,
    generateId: vi.fn(() => `new-section-id-${String(++generatedIdCounter)}`),
  };
});

const mockGetAllByBaseEntity = vi.fn();
vi.mock('../get-all-by-base-entity', () => ({
  getAllByBaseEntity: (baseEntityId: string) =>
    mockGetAllByBaseEntity(baseEntityId) as unknown,
}));

import { duplicateByBaseEntity } from '../duplicate-by-base-entity';

const sourceSections = [
  {
    id: 'section-1',
    base_entity_id: 'source-entity-id',
    name: 'Summary',
    type: 'text',
    content: 'A dwarven merchant',
    checked: 1,
    sort_order: 0,
    created_at: '2023-05-01T08:00:00.000Z',
    updated_at: '2023-05-02T08:00:00.000Z',
  },
  {
    id: 'section-2',
    base_entity_id: 'source-entity-id',
    name: null,
    type: '5e-stat-block',
    content: null,
    checked: 0,
    sort_order: 3,
    created_at: '2023-05-01T08:00:00.000Z',
    updated_at: '2023-05-02T08:00:00.000Z',
  },
];

const INSERT_SQL =
  'INSERT INTO base_entity_content_sections (id, name, type, content, checked, sort_order, base_entity_id, created_at, updated_at) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)';

const sectionInsertCalls = (): [string, unknown[]][] =>
  (mockExecute.mock.calls as [string, unknown[]][]).filter(
    ([sql]) => sql === INSERT_SQL,
  );

describe('baseEntityContentSection.duplicateByBaseEntity', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    generatedIdCounter = 0;
    mockSelect.mockResolvedValue([]);
    mockExecute.mockResolvedValue({});
    mockGetAllByBaseEntity.mockResolvedValue(sourceSections);
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2024-01-15T10:30:00.000Z'));
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.resetModules();
  });

  it('inserts one row per source section', async () => {
    await duplicateByBaseEntity('source-entity-id', 'target-entity-id');

    expect(sectionInsertCalls()).toHaveLength(2);
  });

  it('attaches every copy to the target base entity', async () => {
    await duplicateByBaseEntity('source-entity-id', 'target-entity-id');

    for (const [, values] of sectionInsertCalls()) {
      expect(values[6]).toBe('target-entity-id');
      expect(values).not.toContain('source-entity-id');
    }
  });

  it('copies name, type, content, checked and sort_order', async () => {
    await duplicateByBaseEntity('source-entity-id', 'target-entity-id');

    const [firstCall, secondCall] = sectionInsertCalls();
    expect(firstCall[1].slice(1, 6)).toEqual([
      'Summary',
      'text',
      'A dwarven merchant',
      1,
      0,
    ]);
    expect(secondCall[1].slice(1, 6)).toEqual([
      null,
      '5e-stat-block',
      null,
      0,
      3,
    ]);
  });

  it('generates fresh ids and timestamps', async () => {
    await duplicateByBaseEntity('source-entity-id', 'target-entity-id');

    const ids = sectionInsertCalls().map(([, values]) => values[0]);
    expect(ids).toEqual(['new-section-id-1', 'new-section-id-2']);

    for (const [, values] of sectionInsertCalls()) {
      expect(values[7]).toBe('2024-01-15T10:30:00.000Z');
      expect(values[8]).toBe('2024-01-15T10:30:00.000Z');
    }
  });

  it('inserts nothing when the source has no sections', async () => {
    mockGetAllByBaseEntity.mockResolvedValue([]);

    await duplicateByBaseEntity('source-entity-id', 'target-entity-id');

    expect(sectionInsertCalls()).toHaveLength(0);
  });
});
