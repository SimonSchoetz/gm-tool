// @vitest-environment node
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

vi.mock('@tauri-apps/plugin-sql', async () => {
  const { openTestDatabase } =
    await import('@db/__tests__/support/sqlite-test-database');
  return { default: { load: () => Promise.resolve(openTestDatabase()) } };
});

const FIRST_CREATED_AT = '2026-01-10T09:00:00.000Z';
const SECOND_CREATED_AT = '2026-01-11T09:00:00.000Z';

describe('get', () => {
  beforeEach(() => {
    vi.resetModules();
    vi.useFakeTimers({ toFake: ['Date'] });
    vi.setSystemTime(new Date(FIRST_CREATED_AT));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('returns the requested entity of its own type, and null when asked for it under another type', async () => {
    const { create: createAdventure } = await import('@db/adventure');
    const { create } = await import('../create');
    const { update } = await import('../update');
    const { get } = await import('../get');
    const adventureId = await createAdventure();
    await create('npcs', adventureId);
    vi.setSystemTime(new Date(SECOND_CREATED_AT));
    const secondId = await create('npcs', adventureId);
    await update(secondId, { name: 'Second NPC', description: 'Second' });

    expect(await get('npcs', secondId)).toEqual({
      id: secondId,
      adventure_id: adventureId,
      entity_type: 'npcs',
      name: 'Second NPC',
      description: 'Second',
      image_id: null,
      pinned_order: null,
      created_at: SECOND_CREATED_AT,
      updated_at: SECOND_CREATED_AT,
    });
    expect(await get('pcs', secondId)).toBeNull();
  });

  it('returns null for an id with no entity', async () => {
    const { get } = await import('../get');

    expect(await get('npcs', 'missing-entity')).toBeNull();
  });
});
