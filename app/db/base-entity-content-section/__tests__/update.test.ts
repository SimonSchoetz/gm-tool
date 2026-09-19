// @vitest-environment node
import { describe, it, expect, beforeEach, vi } from 'vitest';
import type {
  BaseEntityContentSection,
  UpdateBaseEntityContentSectionInput,
} from '../types';

vi.mock('@tauri-apps/plugin-sql', async () => {
  const { openTestDatabase } =
    await import('@db/__tests__/support/sqlite-test-database');
  return { default: { load: () => Promise.resolve(openTestDatabase()) } };
});

const readSection = async (id: string) => {
  const { getDatabase } = await import('@db/database');
  const db = await getDatabase();
  const rows = await db.select<BaseEntityContentSection[]>(
    'SELECT * FROM base_entity_content_sections WHERE id = $1',
    [id],
  );
  return rows[0];
};

const createSection = async () => {
  const { create: createAdventure } = await import('@db/adventure');
  const { create: createBaseEntity } = await import('@db/base-entity');
  const { create } = await import('../create');
  const baseEntityId = await createBaseEntity('npcs', await createAdventure());
  return create({ base_entity_id: baseEntityId, type: 'text', sort_order: 0 });
};

describe('update', () => {
  beforeEach(() => {
    vi.resetModules();
  });

  it('rejects a type outside the content section types and leaves the row unchanged', async () => {
    const { update } = await import('../update');
    const id = await createSection();
    const before = await readSection(id);

    await expect(
      update(id, {
        type: 'bogus',
      } as unknown as UpdateBaseEntityContentSectionInput),
    ).rejects.toThrow();

    expect(await readSection(id)).toEqual(before);
  });

  it('writes checked 0 and clears the content with null', async () => {
    const { update } = await import('../update');
    const id = await createSection();
    await update(id, { checked: 1, content: 'c' });
    expect(await readSection(id)).toMatchObject({ checked: 1, content: 'c' });

    await update(id, { checked: 0, content: null });

    expect(await readSection(id)).toMatchObject({ checked: 0, content: null });
  });
});
