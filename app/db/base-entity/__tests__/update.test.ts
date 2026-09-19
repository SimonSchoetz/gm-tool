// @vitest-environment node
import { describe, it, expect, beforeEach, vi } from 'vitest';
import type { BaseEntity, UpdateBaseEntityInput } from '../types';

vi.mock('@tauri-apps/plugin-sql', async () => {
  const { openTestDatabase } =
    await import('@db/__tests__/support/sqlite-test-database');
  return { default: { load: () => Promise.resolve(openTestDatabase()) } };
});

const readBaseEntity = async (id: string) => {
  const { getDatabase } = await import('@db/database');
  const db = await getDatabase();
  const rows = await db.select<BaseEntity[]>(
    'SELECT * FROM base_entities WHERE id = $1',
    [id],
  );
  return rows[0];
};

const createNpc = async () => {
  const { create: createAdventure } = await import('@db/adventure');
  const { create } = await import('../create');
  return create('npcs', await createAdventure());
};

describe('update', () => {
  beforeEach(() => {
    vi.resetModules();
  });

  it('rejects an entity type outside the base entity types and leaves the row unchanged', async () => {
    const { update } = await import('../update');
    const id = await createNpc();
    const before = await readBaseEntity(id);

    await expect(
      update(id, { entity_type: 'bogus' } as unknown as UpdateBaseEntityInput),
    ).rejects.toThrow();

    expect(await readBaseEntity(id)).toEqual(before);
  });

  it('clears description and image_id when they are set to null', async () => {
    const { update } = await import('../update');
    const { getDatabase } = await import('@db/database');
    const id = await createNpc();
    const db = await getDatabase();
    await db.execute(
      'INSERT INTO images (id, file_extension, created_at, updated_at) VALUES ($1, $2, $3, $3)',
      ['image-1', 'png', '2026-01-10T09:00:00.000Z'],
    );
    await update(id, { description: 'to clear', image_id: 'image-1' });
    expect(await readBaseEntity(id)).toMatchObject({
      description: 'to clear',
      image_id: 'image-1',
    });

    await update(id, { description: null, image_id: null });

    expect(await readBaseEntity(id)).toMatchObject({
      description: null,
      image_id: null,
    });
  });
});
