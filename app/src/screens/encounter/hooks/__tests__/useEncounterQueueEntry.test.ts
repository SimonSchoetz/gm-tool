import { renderHook, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type * as baseEntityService from '@services/baseEntityService';
import type * as encounterService from '@services/encounterService';
import type * as logEntryService from '@services/encounterLogEntryService';
import type * as queueService from '@services/encounterQueueService';
import { buildEncounter } from '@/__tests__/support/buildEncounter';
import { buildEncounterQueueItem } from '@/__tests__/support/buildEncounterQueueItem';
import { queryClient, TanstackQueryClientProvider } from '@/data-access-layer';
import { useEncounterQueueEntry } from '../useEncounterQueueEntry';

const getAllBaseEntities = vi.hoisted(() =>
  vi.fn<typeof baseEntityService.getAllBaseEntities>(),
);
const getEncounterById = vi.hoisted(() =>
  vi.fn<typeof encounterService.getEncounterById>(),
);
const getLogEntries = vi.hoisted(() =>
  vi.fn<typeof logEntryService.getLogEntries>(),
);
const getQueueItems = vi.hoisted(() =>
  vi.fn<typeof queueService.getQueueItems>(),
);

vi.mock('@services/baseEntityService', () => ({ getAllBaseEntities }));
vi.mock('@services/encounterService', () => ({ getEncounterById }));
vi.mock('@services/encounterLogEntryService', () => ({ getLogEntries }));
vi.mock('@services/encounterQueueService', () => ({ getQueueItems }));

vi.mock('@tanstack/react-router', async () => {
  const { encounterRouteParams } =
    await import('@/__tests__/support/encounterRouteParams');
  return { useParams: encounterRouteParams };
});

const renderEntry = (queueItemId: string) =>
  renderHook(() => useEncounterQueueEntry(queueItemId), {
    wrapper: TanstackQueryClientProvider,
  });

describe('useEncounterQueueEntry', () => {
  beforeEach(() => {
    queryClient.clear();
    getEncounterById.mockResolvedValue(buildEncounter());
    getQueueItems.mockResolvedValue([
      buildEncounterQueueItem({ id: 'a', name: 'Goblin', sort_order: 0 }),
      buildEncounterQueueItem({ id: 'b', name: 'Orc', sort_order: 1 }),
    ]);
    getLogEntries.mockResolvedValue([]);
    getAllBaseEntities.mockResolvedValue([]);
  });

  it('returns the entry with the given id, not another combatant’s', async () => {
    const { result } = renderEntry('b');

    await waitFor(() => {
      expect(result.current).toMatchObject({ id: 'b', name: 'Orc' });
    });
  });

  it('returns null for an id that is not in the queue', async () => {
    const { result } = renderEntry('missing');
    await waitFor(() => {
      expect(getQueueItems).toHaveBeenCalled();
    });

    expect(result.current).toBeNull();
  });

  it('returns null before the reads resolve', () => {
    getQueueItems.mockReturnValue(new Promise(() => undefined));

    const { result } = renderEntry('a');

    expect(result.current).toBeNull();
  });

  it('returns the entry of an event, not null', async () => {
    getQueueItems.mockResolvedValue([
      buildEncounterQueueItem({
        id: 'e',
        kind: 'event',
        base_entity_id: null,
        sequence_number: null,
        name: 'Lair action',
      }),
    ]);
    const { result } = renderEntry('e');

    await waitFor(() => {
      expect(result.current).toEqual({
        kind: 'event',
        id: 'e',
        name: 'Lair action',
      });
    });
  });
});
