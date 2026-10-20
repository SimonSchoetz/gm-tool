// @vitest-environment node
import { describe, it, expect, beforeEach, vi } from 'vitest';
import type { BaseEntityContentSectionType } from '@domain';
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

const createSection = async (type: BaseEntityContentSectionType) => {
  const { create: createAdventure } = await import('@db/adventure');
  const { create: createBaseEntity } = await import('@db/base-entity');
  const { create } = await import('../create');
  const baseEntityId = await createBaseEntity('npcs', await createAdventure());
  return create({ base_entity_id: baseEntityId, type, sort_order: 0 });
};

const validStatBlockContent = JSON.stringify({
  basicStatBlock: { hp: 5 },
  textEditor: '',
});

const decimalHpStatBlockContent = JSON.stringify({
  basicStatBlock: { hp: 1.5 },
  textEditor: '',
});

describe('update', () => {
  beforeEach(() => {
    vi.resetModules();
  });

  it('rejects a type outside the content section types and leaves the row unchanged', async () => {
    const { update } = await import('../update');
    const id = await createSection('text');
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
    const id = await createSection('text');
    await update(id, { checked: 1, content: 'c' });
    expect(await readSection(id)).toMatchObject({ checked: 1, content: 'c' });

    await update(id, { checked: 0, content: null });

    expect(await readSection(id)).toMatchObject({ checked: 0, content: null });
  });

  it('writes valid stat block content to a basic stat block row', async () => {
    const { update } = await import('../update');
    const id = await createSection('basic-stat-block');

    await update(id, { content: validStatBlockContent });

    expect(await readSection(id)).toMatchObject({
      content: validStatBlockContent,
    });
  });

  it('rejects stat block content with a decimal HP before writing it', async () => {
    const { update } = await import('../update');
    const id = await createSection('basic-stat-block');
    await update(id, { content: validStatBlockContent });
    const before = await readSection(id);

    await expect(
      update(id, { content: decimalHpStatBlockContent }),
    ).rejects.toThrow();

    expect(await readSection(id)).toEqual(before);
  });

  it('writes non-JSON content to a text row instead of validating it as a stat block', async () => {
    const { update } = await import('../update');
    const id = await createSection('text');

    await update(id, { content: 'not json' });

    expect(await readSection(id)).toMatchObject({ content: 'not json' });
  });

  it("validates against the patch's own type instead of the stored type", async () => {
    const { update } = await import('../update');
    const id = await createSection('text');
    const before = await readSection(id);

    await expect(
      update(id, {
        type: 'basic-stat-block',
        content: decimalHpStatBlockContent,
      }),
    ).rejects.toThrow();

    expect(await readSection(id)).toEqual(before);
  });

  it('resolves a content update for an id that matches no row', async () => {
    const { update } = await import('../update');

    await expect(
      update('no-such-section', { content: 'not json' }),
    ).resolves.toBeUndefined();
  });
});
