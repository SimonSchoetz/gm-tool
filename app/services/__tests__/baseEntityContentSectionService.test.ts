import { describe, it, expect, beforeEach, vi } from 'vitest';
import type * as sectionDb from '@db/base-entity-content-section';
import { buildSection } from './support/encounterQueueFixtures';

const getAllByBaseEntity = vi.hoisted(() =>
  vi.fn<typeof sectionDb.getAllByBaseEntity>(),
);
const create = vi.hoisted(() => vi.fn<typeof sectionDb.create>());
const update = vi.hoisted(() => vi.fn<typeof sectionDb.update>());
const remove = vi.hoisted(() => vi.fn<typeof sectionDb.remove>());
const updateSortOrders = vi.hoisted(() =>
  vi.fn<typeof sectionDb.updateSortOrders>(),
);

vi.mock('@db/base-entity-content-section', () => ({
  getAllByBaseEntity,
  create,
  update,
  remove,
  updateSortOrders,
}));

beforeEach(() => {
  vi.resetModules();
  getAllByBaseEntity.mockReset().mockResolvedValue([]);
  create.mockReset().mockResolvedValue('new-section');
  update.mockReset().mockResolvedValue();
  remove.mockReset().mockResolvedValue();
  updateSortOrders.mockReset().mockResolvedValue();
});

describe('getSectionsByBaseEntityId', () => {
  it("returns the base entity's sections", async () => {
    const { getSectionsByBaseEntityId } =
      await import('../baseEntityContentSectionService');
    const sections = [buildSection('text', 'a')];
    getAllByBaseEntity.mockResolvedValue(sections);

    await expect(getSectionsByBaseEntityId('entity-7')).resolves.toEqual(
      sections,
    );
    expect(getAllByBaseEntity).toHaveBeenCalledWith('entity-7');
  });

  it('rejects as BaseEntityContentSectionLoadError when the load fails', async () => {
    const { getSectionsByBaseEntityId } =
      await import('../baseEntityContentSectionService');
    getAllByBaseEntity.mockRejectedValue(new Error('disk'));

    await expect(getSectionsByBaseEntityId('entity-7')).rejects.toMatchObject({
      name: 'BaseEntityContentSectionLoadError',
    });
  });
});

describe('createSection', () => {
  it('creates a section of the given type and name for the base entity and returns its id', async () => {
    const { createSection } =
      await import('../baseEntityContentSectionService');

    await expect(createSection('entity-7', 'text', 'Backstory')).resolves.toBe(
      'new-section',
    );

    expect(create).toHaveBeenCalledWith({
      base_entity_id: 'entity-7',
      type: 'text',
      name: 'Backstory',
    });
  });

  it('leaves the name out of the input when none is given', async () => {
    const { createSection } =
      await import('../baseEntityContentSectionService');

    await createSection('entity-7', '5e-stat-block');

    expect(create).toHaveBeenCalledWith({
      base_entity_id: 'entity-7',
      type: '5e-stat-block',
    });
    expect(create.mock.calls[0][0]).not.toHaveProperty('name');
  });

  it('passes an empty name on, as a name the caller gave', async () => {
    const { createSection } =
      await import('../baseEntityContentSectionService');

    await createSection('entity-7', 'text', '');

    expect(create).toHaveBeenCalledWith({
      base_entity_id: 'entity-7',
      type: 'text',
      name: '',
    });
  });

  it('rejects as BaseEntityContentSectionCreateError when the section cannot be created', async () => {
    const { createSection } =
      await import('../baseEntityContentSectionService');
    create.mockRejectedValueOnce(new Error('disk'));

    await expect(createSection('entity-7', 'text')).rejects.toMatchObject({
      name: 'BaseEntityContentSectionCreateError',
    });
  });
});

describe('updateSection and deleteSection', () => {
  it('hand the id and the data to the update, and the id to the removal', async () => {
    const { updateSection, deleteSection } =
      await import('../baseEntityContentSectionService');

    await updateSection('s1', { content: 'text' });
    await deleteSection('s1');

    expect(update).toHaveBeenCalledWith('s1', { content: 'text' });
    expect(remove).toHaveBeenCalledWith('s1');
  });

  it('reject as an update error and a delete error when the call fails', async () => {
    const { updateSection, deleteSection } =
      await import('../baseEntityContentSectionService');
    update.mockRejectedValue(new Error('disk'));
    remove.mockRejectedValue(new Error('disk'));

    await expect(updateSection('s1', {})).rejects.toMatchObject({
      name: 'BaseEntityContentSectionUpdateError',
    });
    await expect(deleteSection('s1')).rejects.toMatchObject({
      name: 'BaseEntityContentSectionDeleteError',
    });
  });
});

describe('bulkReorderSections', () => {
  it('gives each section the sort order of its position in the list, in one write', async () => {
    const { bulkReorderSections } =
      await import('../baseEntityContentSectionService');

    await bulkReorderSections(['c', 'a', 'b']);

    expect(updateSortOrders.mock.calls).toEqual([
      [
        [
          { id: 'c', sort_order: 0 },
          { id: 'a', sort_order: 1 },
          { id: 'b', sort_order: 2 },
        ],
      ],
    ]);
  });

  it('rejects as BaseEntityContentSectionReorderError when the write fails', async () => {
    const { bulkReorderSections } =
      await import('../baseEntityContentSectionService');
    updateSortOrders.mockRejectedValueOnce(new Error('disk'));

    await expect(bulkReorderSections(['a', 'b'])).rejects.toMatchObject({
      name: 'BaseEntityContentSectionReorderError',
    });
  });
});
