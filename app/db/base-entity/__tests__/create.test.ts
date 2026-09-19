// @vitest-environment node
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { entityTypeLabel } from '@domain';
import { getDateTimeString } from '@util';
import type { BaseEntity } from '../types';

vi.mock('@tauri-apps/plugin-sql', async () => {
  const { openTestDatabase } =
    await import('@db/__tests__/support/sqlite-test-database');
  return { default: { load: () => Promise.resolve(openTestDatabase()) } };
});

const CREATED_AT = '2026-01-10T09:00:00.000Z';

const readBaseEntities = async () => {
  const { getDatabase } = await import('@db/database');
  const db = await getDatabase();
  return db.select<BaseEntity[]>('SELECT * FROM base_entities');
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

  it('stores an entity of the given type for the adventure, named after its type label and the creation time', async () => {
    const { create: createAdventure } = await import('@db/adventure');
    const { create } = await import('../create');
    const adventureId = await createAdventure();

    const id = await create('npcs', adventureId);

    expect(await readBaseEntities()).toEqual([
      {
        id,
        adventure_id: adventureId,
        entity_type: 'npcs',
        name: `New ${entityTypeLabel('npcs')} ${getDateTimeString(CREATED_AT)}`,
        description: null,
        image_id: null,
        pinned_order: null,
        created_at: CREATED_AT,
        updated_at: CREATED_AT,
      },
    ]);
  });

  it('rejects an adventure id with no adventure and stores nothing', async () => {
    const { create } = await import('../create');

    await expect(create('npcs', 'missing-adventure')).rejects.toThrow(
      'FOREIGN KEY constraint failed',
    );

    expect(await readBaseEntities()).toEqual([]);
  });
});
