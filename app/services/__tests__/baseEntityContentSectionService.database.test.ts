// @vitest-environment node
import { describe, it, expect, beforeEach, vi } from 'vitest';
import type { BaseEntityContentSection } from '@db/base-entity-content-section';
import {
  testDatabase,
  writeFailingOnCall,
} from './support/failingDatabaseCall';

// Runs the real baseEntityContentSectionService against the real in-memory database; baseEntityContentSectionService.test.ts mocks the db modules to test the service's own branching and error wrapping.

vi.mock('@tauri-apps/plugin-sql', async () => {
  const { openTestDatabase } =
    await import('@db/__tests__/support/sqlite-test-database');
  return { default: { load: () => Promise.resolve(openTestDatabase()) } };
});

const load = async () => {
  const sectionService =
    await import('@services/baseEntityContentSectionService');
  const adventureDb = await import('@db/adventure');
  const baseEntityDb = await import('@db/base-entity');
  const sectionDb = await import('@db/base-entity-content-section');
  const { getDatabase } = await import('@db/database');
  const readSections = async (baseEntityId: string) =>
    (await getDatabase()).select<
      Pick<BaseEntityContentSection, 'id' | 'sort_order'>[]
    >(
      'SELECT id, sort_order FROM base_entity_content_sections WHERE base_entity_id = $1 ORDER BY sort_order',
      [baseEntityId],
    );
  const adventureId = await adventureDb.create();
  const createEntityWithSections = async (sortOrders: number[]) => {
    const baseEntityId = await baseEntityDb.create('npcs', adventureId);
    const sectionIds: string[] = [];
    for (const sortOrder of sortOrders) {
      const sectionId = await sectionDb.create({
        base_entity_id: baseEntityId,
        type: 'text',
      });
      await sectionDb.update(sectionId, { sort_order: sortOrder });
      sectionIds.push(sectionId);
    }
    return { baseEntityId, sectionIds };
  };
  const db = await testDatabase(getDatabase);
  return { sectionService, readSections, createEntityWithSections, db };
};

describe('baseEntityContentSectionService against the database', () => {
  beforeEach(() => {
    vi.resetModules();
  });

  it('stores two sections at consecutive sort orders after the entity’s highest, unaffected by another entity’s sections', async () => {
    const { sectionService, readSections, createEntityWithSections } =
      await load();
    await createEntityWithSections([20, 21]);
    const {
      baseEntityId,
      sectionIds: [existingId],
    } = await createEntityWithSections([4]);

    const firstId = await sectionService.createSection(baseEntityId, 'text');
    const secondId = await sectionService.createSection(
      baseEntityId,
      'basic-stat-block',
      'Stats',
    );

    expect(await readSections(baseEntityId)).toEqual([
      { id: existingId, sort_order: 4 },
      { id: firstId, sort_order: 5 },
      { id: secondId, sort_order: 6 },
    ]);
  });

  it('reorders sections in bulk, so a later read returns the requested order', async () => {
    const { sectionService, readSections, createEntityWithSections } =
      await load();
    const {
      baseEntityId,
      sectionIds: [first, second, third],
    } = await createEntityWithSections([0, 1, 2]);

    await sectionService.bulkReorderSections([third, first, second]);

    expect(
      (await readSections(baseEntityId)).map((section) => section.id),
    ).toEqual([third, first, second]);
  });

  it('stores two sections added at the same time at two different sort orders', async () => {
    const { sectionService, readSections, createEntityWithSections } =
      await load();
    const { baseEntityId } = await createEntityWithSections([0]);

    await Promise.all([
      sectionService.createSection(baseEntityId, 'text'),
      sectionService.createSection(baseEntityId, 'text'),
    ]);

    expect(
      (await readSections(baseEntityId)).map((section) => section.sort_order),
    ).toEqual([0, 1, 2]);
  });

  it('leaves the old order or the whole new one, never a mix, when any database call of a bulk reorder fails', async () => {
    const { sectionService, readSections, createEntityWithSections, db } =
      await load();
    const {
      baseEntityId,
      sectionIds: [first, second, third],
    } = await createEntityWithSections([0, 1, 2]);

    for (const callNumber of [1, 2, 3]) {
      await writeFailingOnCall(db, callNumber, () =>
        sectionService.bulkReorderSections([third, first, second]),
      );
      const sections = await readSections(baseEntityId);
      expect([
        [first, second, third],
        [third, first, second],
      ]).toContainEqual(sections.map((section) => section.id));
      expect(sections.map((section) => section.sort_order)).toEqual([0, 1, 2]);
      await sectionService.bulkReorderSections([first, second, third]);
    }
  });
});
