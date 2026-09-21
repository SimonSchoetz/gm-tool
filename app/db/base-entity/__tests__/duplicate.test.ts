// @vitest-environment node
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { entityTypeLabel } from '@domain';
import type { BaseEntity } from '../types';

vi.mock('@tauri-apps/plugin-sql', async () => {
  const { openTestDatabase } =
    await import('@db/__tests__/support/sqlite-test-database');
  return { default: { load: () => Promise.resolve(openTestDatabase()) } };
});

const T1 = '2026-01-10T09:00:00.000Z';
const T2 = '2026-01-11T09:00:00.000Z';
const SOURCE_IMAGE_ID = 'image-of-the-source';
const COPY_IMAGE_ID = 'image-of-the-copy';

const readBaseEntity = async (id: string) => {
  const { getDatabase } = await import('@db/database');
  const db = await getDatabase();
  const rows = await db.select<BaseEntity[]>(
    'SELECT * FROM base_entities WHERE id = $1',
    [id],
  );
  return rows[0];
};

// The source holds a description, an image and a pin, so a copy of a column the duplicate must reset or replace shows. The images are foreign-key targets only, so they are plain rows.
const seedSourceEntity = async () => {
  const { create: createAdventure } = await import('@db/adventure');
  const { create } = await import('../create');
  const { update } = await import('../update');
  const { setPinnedOrder } = await import('@db/pinned-order');
  const { seedImage } = await import('@db/__tests__/support/image-fixtures');
  for (const imageId of [SOURCE_IMAGE_ID, COPY_IMAGE_ID]) {
    await seedImage(imageId, 'png', T1);
  }
  const adventureId = await createAdventure();
  const sourceId = await create('npcs', adventureId);
  await update(sourceId, { description: 'd', image_id: SOURCE_IMAGE_ID });
  await setPinnedOrder('npcs', sourceId, 2);
  return { adventureId, sourceId };
};

describe('duplicate', () => {
  beforeEach(() => {
    vi.resetModules();
    vi.useFakeTimers({ toFake: ['Date'] });
    vi.setSystemTime(new Date(T1));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('creates a new entity of the same type and adventure that takes the given image and resets the name, pin and timestamps', async () => {
    const { duplicate } = await import('../duplicate');
    const { adventureId, sourceId } = await seedSourceEntity();
    vi.setSystemTime(new Date(T2));

    const duplicateId = await duplicate('npcs', sourceId, COPY_IMAGE_ID);

    expect(duplicateId).not.toBe(sourceId);
    expect(await readBaseEntity(duplicateId)).toEqual({
      id: duplicateId,
      adventure_id: adventureId,
      entity_type: 'npcs',
      name: null,
      description: 'd',
      image_id: COPY_IMAGE_ID,
      pinned_order: null,
      created_at: T2,
      updated_at: T2,
    });
  });

  it('leaves the source entity unchanged, timestamps included', async () => {
    const { duplicate } = await import('../duplicate');
    const { sourceId } = await seedSourceEntity();
    const before = await readBaseEntity(sourceId);
    vi.setSystemTime(new Date(T2));

    await duplicate('npcs', sourceId, COPY_IMAGE_ID);

    expect(await readBaseEntity(sourceId)).toEqual(before);
  });

  it('rejects an id of another entity type', async () => {
    const { duplicate } = await import('../duplicate');
    const { sourceId } = await seedSourceEntity();

    await expect(duplicate('pcs', sourceId, null)).rejects.toThrow(
      `${entityTypeLabel('pcs')} not found: ${sourceId}`,
    );
  });
});
