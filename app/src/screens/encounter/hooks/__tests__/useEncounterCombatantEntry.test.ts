import { renderHook, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type * as baseEntityService from '@services/baseEntityService';
import type * as encounterService from '@services/encounterService';
import type * as logEntryService from '@services/encounterLogEntryService';
import type * as queueService from '@services/encounterQueueService';
import { buildEncounter } from '@/__tests__/support/buildEncounter';
import { buildEncounterQueueItem } from '@/__tests__/support/buildEncounterQueueItem';
import { queryClient, TanstackQueryClientProvider } from '@/data-access-layer';
import { useEncounterCombatantEntry } from '../useEncounterCombatantEntry';

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
  renderHook(() => useEncounterCombatantEntry(queueItemId), {
    wrapper: TanstackQueryClientProvider,
  });

describe('useEncounterCombatantEntry', () => {
  beforeEach(() => {
    queryClient.clear();
    getEncounterById.mockResolvedValue(buildEncounter());
    getQueueItems.mockResolvedValue([
      buildEncounterQueueItem({ id: 'a', name: 'Goblin', sort_order: 0 }),
      buildEncounterQueueItem({
        id: 'e',
        kind: 'event',
        base_entity_id: null,
        sequence_number: null,
        name: 'Lair action',
        sort_order: 1,
      }),
    ]);
    getLogEntries.mockResolvedValue([]);
    getAllBaseEntities.mockResolvedValue([]);
  });

  it('returns the combatant entry with the given id', async () => {
    const { result } = renderEntry('a');

    await waitFor(() => {
      expect(result.current).toMatchObject({
        kind: 'combatant',
        id: 'a',
        name: 'Goblin',
      });
    });
  });

  it('returns null for the id of an event, once the reads resolved', async () => {
    const { result } = renderEntry('e');
    await waitFor(() => {
      expect(getQueueItems).toHaveBeenCalled();
    });
    await waitFor(() => {
      expect(getAllBaseEntities).toHaveBeenCalled();
    });

    expect(result.current).toBeNull();
  });

  it('returns null for an id that is not in the queue', async () => {
    const { result } = renderEntry('missing');
    await waitFor(() => {
      expect(getQueueItems).toHaveBeenCalled();
    });

    expect(result.current).toBeNull();
  });
});
