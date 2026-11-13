// @vitest-environment node
import { describe, it, expect, beforeEach, vi } from 'vitest';

vi.mock('@tauri-apps/plugin-sql', async () => {
  const { openTestDatabase } =
    await import('@db/__tests__/support/sqlite-test-database');
  return { default: { load: () => Promise.resolve(openTestDatabase()) } };
});

const SEEDED_AT = '2026-01-10T09:00:00.000Z';

describe('isImageReferenced', () => {
  beforeEach(() => {
    vi.resetModules();
  });

  it('is true for an image an adventure, a base entity or an encounter names, and false for one nothing names', async () => {
    const { isImageReferenced } = await import('../image-references');
    const { seedImage } = await import('./support/image-fixtures');
    const adventureDb = await import('@db/adventure');
    const baseEntityDb = await import('@db/base-entity');
    const encounterDb = await import('@db/encounter');
    for (const id of ['adventure-image', 'entity-image', 'cover', 'loose']) {
      await seedImage(id, 'png', SEEDED_AT);
    }
    const adventureId = await adventureDb.create();
    await adventureDb.update(adventureId, { image_id: 'adventure-image' });
    const baseEntityId = await baseEntityDb.create('npcs', adventureId);
    await baseEntityDb.update(baseEntityId, { image_id: 'entity-image' });
    const encounterId = await encounterDb.create(adventureId);
    await encounterDb.update(encounterId, { image_id: 'cover' });

    expect(await isImageReferenced('adventure-image')).toBe(true);
    expect(await isImageReferenced('entity-image')).toBe(true);
    expect(await isImageReferenced('cover')).toBe(true);
    expect(await isImageReferenced('loose')).toBe(false);
  });

  it('is false for an image whose id another foreign-key column happens to hold, since only image columns name an image', async () => {
    const { isImageReferenced } = await import('../image-references');
    const { seedImage } = await import('./support/image-fixtures');
    const adventureDb = await import('@db/adventure');
    const baseEntityDb = await import('@db/base-entity');
    const adventureId = await adventureDb.create();
    await baseEntityDb.create('npcs', adventureId);
    await seedImage(adventureId, 'png', SEEDED_AT);

    expect(await isImageReferenced(adventureId)).toBe(false);
  });
});
