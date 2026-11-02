import { describe, it, expect, beforeEach, vi } from 'vitest';
import type * as encounterDb from '@db/encounter';
import type * as queueItemDb from '@db/encounter-queue-item';
import type * as logEntryDb from '@db/encounter-log-entry';
import type * as imageDb from '@db/image';
import { buildEncounterQueueItem } from './support/encounterQueueFixtures';
import { buildEncounter } from './support/encounterFixtures';

const getEncounter = vi.hoisted(() => vi.fn<typeof encounterDb.get>());
const duplicate = vi.hoisted(() => vi.fn<typeof encounterDb.duplicate>());
const removeEncounter = vi.hoisted(() => vi.fn<typeof encounterDb.remove>());
const duplicateImage = vi.hoisted(() => vi.fn<typeof imageDb.duplicate>());
const removeImage = vi.hoisted(() => vi.fn<typeof imageDb.remove>());
const getAllQueueItems = vi.hoisted(() =>
  vi.fn<typeof queueItemDb.getAllByEncounter>(),
);
const duplicateByEncounter = vi.hoisted(() =>
  vi.fn<typeof queueItemDb.duplicateByEncounter>(),
);
const getAllLogEntries = vi.hoisted(() =>
  vi.fn<typeof logEntryDb.getAllByEncounter>(),
);

vi.mock('@db/encounter', () => ({
  get: getEncounter,
  duplicate,
  remove: removeEncounter,
}));
vi.mock('@db/image', () => ({
  duplicate: duplicateImage,
  remove: removeImage,
}));
vi.mock('@db/encounter-queue-item', () => ({
  getAllByEncounter: getAllQueueItems,
  duplicateByEncounter,
}));
vi.mock('@db/encounter-log-entry', () => ({
  getAllByEncounter: getAllLogEntries,
}));
vi.mock('@db/base-entity', () => ({}));
vi.mock('@db/base-entity-content-section', () => ({}));

const resetSpies = () => {
  getEncounter.mockReset().mockResolvedValue(buildEncounter({ id: 'source' }));
  duplicate.mockReset().mockResolvedValue('new-encounter');
  removeEncounter.mockReset().mockResolvedValue();
  duplicateImage.mockReset().mockResolvedValue('copied-image');
  removeImage.mockReset().mockResolvedValue();
  getAllQueueItems
    .mockReset()
    .mockResolvedValue([buildEncounterQueueItem({ id: 'a' })]);
  getAllLogEntries.mockReset().mockResolvedValue([]);
  duplicateByEncounter.mockReset().mockResolvedValue();
};

describe('duplicateEncounter', () => {
  beforeEach(() => {
    vi.resetModules();
    resetSpies();
  });

  it('copies the source cover first, creates the encounter with the copy, then copies the queue and resolves the new id', async () => {
    const { duplicateEncounter } = await import('../encounterService');
    getEncounter.mockResolvedValue(
      buildEncounter({ id: 'source', image_id: 'source-image' }),
    );

    await expect(duplicateEncounter('source')).resolves.toBe('new-encounter');

    expect(duplicateImage).toHaveBeenCalledWith('source-image');
    expect(duplicate).toHaveBeenCalledWith('source', 'copied-image');
    expect(duplicateByEncounter).toHaveBeenCalledWith(
      'source',
      'new-encounter',
      new Map([['a', null]]),
    );
    expect(duplicateImage.mock.invocationCallOrder[0]).toBeLessThan(
      duplicate.mock.invocationCallOrder[0],
    );
    expect(duplicate.mock.invocationCallOrder[0]).toBeLessThan(
      duplicateByEncounter.mock.invocationCallOrder[0],
    );
  });

  it('gives the copy no cover and copies no image when the source has none', async () => {
    const { duplicateEncounter } = await import('../encounterService');

    await duplicateEncounter('source');

    expect(duplicate).toHaveBeenCalledWith('source', null);
    expect(duplicateImage).not.toHaveBeenCalled();
  });

  it('rejects as EncounterDuplicateError and creates no encounter when the cover copy fails', async () => {
    const { duplicateEncounter } = await import('../encounterService');
    getEncounter.mockResolvedValue(
      buildEncounter({ id: 'source', image_id: 'source-image' }),
    );
    duplicateImage.mockRejectedValue(new Error('disk full'));

    await expect(duplicateEncounter('source')).rejects.toMatchObject({
      name: 'EncounterDuplicateError',
    });

    expect(duplicate).not.toHaveBeenCalled();
  });

  it('rejects as EncounterDuplicateError when the queue copy fails', async () => {
    const { duplicateEncounter } = await import('../encounterService');
    duplicateByEncounter.mockRejectedValue(new Error('disk full'));

    await expect(duplicateEncounter('source')).rejects.toMatchObject({
      name: 'EncounterDuplicateError',
    });
  });
});

describe('deleteEncounter', () => {
  beforeEach(() => {
    vi.resetModules();
    resetSpies();
  });

  it('deletes the cover image before the encounter row', async () => {
    const { deleteEncounter } = await import('../encounterService');
    getEncounter.mockResolvedValue(
      buildEncounter({ id: 'source', image_id: 'source-image' }),
    );

    await deleteEncounter('source');

    expect(removeImage).toHaveBeenCalledWith('source-image');
    expect(removeEncounter).toHaveBeenCalledWith('source');
    expect(removeImage.mock.invocationCallOrder[0]).toBeLessThan(
      removeEncounter.mock.invocationCallOrder[0],
    );
  });

  it('deletes only the encounter row when it has no cover', async () => {
    const { deleteEncounter } = await import('../encounterService');

    await deleteEncounter('source');

    expect(removeImage).not.toHaveBeenCalled();
    expect(removeEncounter).toHaveBeenCalledWith('source');
  });

  it('rejects as EncounterDeleteError and keeps the encounter when the cover delete fails', async () => {
    const { deleteEncounter } = await import('../encounterService');
    getEncounter.mockResolvedValue(
      buildEncounter({ id: 'source', image_id: 'source-image' }),
    );
    removeImage.mockRejectedValue(new Error('disk locked'));

    await expect(deleteEncounter('source')).rejects.toMatchObject({
      name: 'EncounterDeleteError',
    });

    expect(removeEncounter).not.toHaveBeenCalled();
  });
});
