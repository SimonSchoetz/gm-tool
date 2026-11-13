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

  it('stores a section created without a name as unchecked with no name or content, at sort order 0 as the entity’s first', async () => {
    const { create } = await import('../create');
    const baseEntityId = await createBaseEntity();

    const id = await create({
      base_entity_id: baseEntityId,
      type: '5e-stat-block',
    });

    expect(await readSections()).toEqual([
      {
        id,
        base_entity_id: baseEntityId,
        name: null,
        type: '5e-stat-block',
        content: null,
        checked: 0,
        sort_order: 0,
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
      name: 'Backstory',
    });

    expect(await readSections()).toMatchObject([{ name: 'Backstory' }]);
  });

  it('places a section one past the highest sort order of its own entity, whatever another entity holds', async () => {
    const { create } = await import('../create');
    const { update } = await import('../update');
    const { create: createAdventure } = await import('@db/adventure');
    const { create: createEntity } = await import('@db/base-entity');
    const adventureId = await createAdventure();
    const baseEntityId = await createEntity('npcs', adventureId);
    const otherEntityId = await createEntity('npcs', adventureId);
    const existingId = await create({
      base_entity_id: baseEntityId,
      type: 'text',
    });
    await update(existingId, { sort_order: 4 });
    const otherId = await create({
      base_entity_id: otherEntityId,
      type: 'text',
    });
    await update(otherId, { sort_order: 9 });

    const id = await create({ base_entity_id: baseEntityId, type: 'text' });

    const sections = await readSections();
    expect(sections.find((section) => section.id === id)?.sort_order).toBe(5);
    expect(sections.find((section) => section.id === otherId)?.sort_order).toBe(
      9,
    );
  });

  it('rejects a base entity id with no base entity and stores nothing', async () => {
    const { create } = await import('../create');

    await expect(
      create({ base_entity_id: 'missing-entity', type: 'text' }),
    ).rejects.toThrow(/^FOREIGN KEY constraint failed$/);

    expect(await readSections()).toEqual([]);
  });
});

describe('create input guards', () => {
  it('rejects a blank id, naming Base entity in its message', async () => {
    const { create } = await import('../create');

    await expect(create({ base_entity_id: '', type: 'text' })).rejects.toThrow(
      /^Valid Base entity ID is required$/,
    );
  });
});
