import { describe, it, expect, beforeEach, vi } from 'vitest';
import type * as sectionDb from '@db/base-entity-content-section';
import { buildSection } from './support/encounterQueueFixtures';

const getAllByBaseEntity = vi.hoisted(() =>
  vi.fn<typeof sectionDb.getAllByBaseEntity>(),
);
const create = vi.hoisted(() => vi.fn<typeof sectionDb.create>());
const update = vi.hoisted(() => vi.fn<typeof sectionDb.update>());
const remove = vi.hoisted(() => vi.fn<typeof sectionDb.remove>());

vi.mock('@db/base-entity-content-section', () => ({
  getAllByBaseEntity,
  create,
  update,
  remove,
}));

beforeEach(() => {
  vi.resetModules();
  getAllByBaseEntity.mockReset().mockResolvedValue([]);
  create.mockReset().mockResolvedValue('new-section');
  update.mockReset().mockResolvedValue();
  remove.mockReset().mockResolvedValue();
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
  it('sorts the new section after the highest sort order of the base entity, whatever the order of the list', async () => {
    const { createSection } =
      await import('../baseEntityContentSectionService');
    getAllByBaseEntity.mockResolvedValue([
      { ...buildSection('text', null), sort_order: 3 },
      { ...buildSection('basic-stat-block', null), sort_order: 8 },
      { ...buildSection('5e-stat-block', null), sort_order: 1 },
    ]);

    await expect(createSection('entity-7', 'text', 'Backstory')).resolves.toBe(
      'new-section',
    );

    expect(getAllByBaseEntity).toHaveBeenCalledWith('entity-7');
    expect(create).toHaveBeenCalledWith({
      base_entity_id: 'entity-7',
      type: 'text',
      sort_order: 9,
      name: 'Backstory',
    });
  });

  it('sorts the first section first and leaves the name out of the input when none is given', async () => {
    const { createSection } =
      await import('../baseEntityContentSectionService');

    await createSection('entity-7', '5e-stat-block');

    expect(create).toHaveBeenCalledWith({
      base_entity_id: 'entity-7',
      type: '5e-stat-block',
      sort_order: 0,
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
      sort_order: 0,
      name: '',
    });
  });

  it('rejects as BaseEntityContentSectionCreateError when the sections cannot be read or the section cannot be created', async () => {
    const { createSection } =
      await import('../baseEntityContentSectionService');
    getAllByBaseEntity.mockRejectedValueOnce(new Error('disk'));

    await expect(createSection('entity-7', 'text')).rejects.toMatchObject({
      name: 'BaseEntityContentSectionCreateError',
    });
    expect(create).not.toHaveBeenCalled();

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
  it('gives each section the sort order of its position in the list, in order', async () => {
    const { bulkReorderSections } =
      await import('../baseEntityContentSectionService');

    await bulkReorderSections(['c', 'a', 'b']);

    expect(update.mock.calls).toEqual([
      ['c', { sort_order: 0 }],
      ['a', { sort_order: 1 }],
      ['b', { sort_order: 2 }],
    ]);
  });

  it('updates nothing for an empty list, and rejects as BaseEntityContentSectionReorderError, updating no later section, when an update fails', async () => {
    const { bulkReorderSections } =
      await import('../baseEntityContentSectionService');

    await bulkReorderSections([]);

    expect(update).not.toHaveBeenCalled();

    update.mockRejectedValueOnce(new Error('disk'));

    await expect(bulkReorderSections(['a', 'b'])).rejects.toMatchObject({
      name: 'BaseEntityContentSectionReorderError',
    });
    expect(update).toHaveBeenCalledTimes(1);
  });
});
