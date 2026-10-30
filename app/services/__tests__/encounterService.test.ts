import { describe, it, expect, beforeEach, vi } from 'vitest';
import type * as encounterDb from '@db/encounter';
import type * as queueItemDb from '@db/encounter-queue-item';
import type * as logEntryDb from '@db/encounter-log-entry';
import { buildEncounterQueueItem } from './support/encounterQueueFixtures';

const duplicate = vi.hoisted(() => vi.fn<typeof encounterDb.duplicate>());
const getAllQueueItems = vi.hoisted(() =>
  vi.fn<typeof queueItemDb.getAllByEncounter>(),
);
const duplicateByEncounter = vi.hoisted(() =>
  vi.fn<typeof queueItemDb.duplicateByEncounter>(),
);
const getAllLogEntries = vi.hoisted(() =>
  vi.fn<typeof logEntryDb.getAllByEncounter>(),
);

vi.mock('@db/encounter', () => ({ duplicate }));
vi.mock('@db/encounter-queue-item', () => ({
  getAllByEncounter: getAllQueueItems,
  duplicateByEncounter,
}));
vi.mock('@db/encounter-log-entry', () => ({
  getAllByEncounter: getAllLogEntries,
}));
vi.mock('@db/base-entity', () => ({}));
vi.mock('@db/base-entity-content-section', () => ({}));

describe('duplicateEncounter', () => {
  beforeEach(() => {
    vi.resetModules();
    duplicate.mockReset().mockResolvedValue('new-encounter');
    getAllQueueItems
      .mockReset()
      .mockResolvedValue([buildEncounterQueueItem({ id: 'a' })]);
    getAllLogEntries.mockReset().mockResolvedValue([]);
    duplicateByEncounter.mockReset().mockResolvedValue();
  });

  it('creates the encounter first, then copies the queue from the source into the new encounter and resolves the new id', async () => {
    const { duplicateEncounter } = await import('../encounterService');

    await expect(duplicateEncounter('source')).resolves.toBe('new-encounter');

    expect(duplicate).toHaveBeenCalledWith('source');
    expect(duplicateByEncounter).toHaveBeenCalledWith(
      'source',
      'new-encounter',
      new Map([['a', null]]),
    );
    expect(duplicate.mock.invocationCallOrder[0]).toBeLessThan(
      duplicateByEncounter.mock.invocationCallOrder[0],
    );
  });

  it('rejects as EncounterDuplicateError when the queue copy fails', async () => {
    const { duplicateEncounter } = await import('../encounterService');
    duplicateByEncounter.mockRejectedValue(new Error('disk full'));

    await expect(duplicateEncounter('source')).rejects.toMatchObject({
      name: 'EncounterDuplicateError',
    });
  });
});
