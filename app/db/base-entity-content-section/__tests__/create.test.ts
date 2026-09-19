// @vitest-environment node
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import type { BaseEntityContentSection } from '../types';

vi.mock('@tauri-apps/plugin-sql', async () => {
  const { openTestDatabase } =
    await import('@db/__tests__/support/sqlite-test-database');
  return { default: { load: () => Promise.resolve(openTestDatabase()) } };
});

const CREATED_AT = '2026-01-10T09:00:00.000Z';

const readSections = async () => {
  const { getDatabase } = await import('@db/database');
  const db = await getDatabase();
  return db.select<BaseEntityContentSection[]>(
    'SELECT * FROM base_entity_content_sections',
  );
};

const createBaseEntity = async () => {
  const { create: createAdventure } = await import('@db/adventure');
  const { create } = await import('@db/base-entity');
  return create('npcs', await createAdventure());
};

describe('create', () => {
  beforeEach(() => {
    vi.resetModules();
    vi.useFakeTimers({ toFake: ['Date'] });
    vi.setSystemTime(new Date(CREATED_AT));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('stores a section created without a name as unchecked with no name or content', async () => {
    const { create } = await import('../create');
    const baseEntityId = await createBaseEntity();

    const id = await create({
      base_entity_id: baseEntityId,
      type: '5e-stat-block',
      sort_order: 4,
    });

    expect(await readSections()).toEqual([
      {
        id,
        base_entity_id: baseEntityId,
        name: null,
        type: '5e-stat-block',
        content: null,
        checked: 0,
        sort_order: 4,
        created_at: CREATED_AT,
        updated_at: CREATED_AT,
      },
    ]);
  });

  it('stores the name when one is given', async () => {
    const { create } = await import('../create');
    const baseEntityId = await createBaseEntity();

    await create({
      base_entity_id: baseEntityId,
      type: 'text',
      sort_order: 0,
      name: 'Backstory',
    });

    expect(await readSections()).toMatchObject([{ name: 'Backstory' }]);
  });

  it('rejects a base entity id with no base entity and stores nothing', async () => {
    const { create } = await import('../create');

    await expect(
      create({ base_entity_id: 'missing-entity', type: 'text', sort_order: 0 }),
    ).rejects.toThrow('FOREIGN KEY constraint failed');

    expect(await readSections()).toEqual([]);
  });
});
