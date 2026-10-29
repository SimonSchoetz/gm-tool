import { renderHook, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { EncounterLogEntry } from '@db/encounter-log-entry';
import { BASE_ENTITY_TYPES } from '@domain';
import type * as baseEntityService from '@services/baseEntityService';
import type * as encounterService from '@services/encounterService';
import type * as logEntryService from '@services/encounterLogEntryService';
import type * as queueService from '@services/encounterQueueService';
import { buildEncounter } from '@/__tests__/support/buildEncounter';
import { buildEncounterLogEntry } from '@/__tests__/support/buildEncounterLogEntry';
import { buildEncounterQueueItem } from '@/__tests__/support/buildEncounterQueueItem';
import { queryClient, TanstackQueryClientProvider } from '@/data-access-layer';
import { useEncounterQueueEntries } from '../useEncounterQueueEntries';

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

const goblin = buildEncounterQueueItem({ id: 'a', name: 'Goblin' });
const defeatedEntry = buildEncounterLogEntry('defeated', {
  queueItemIds: ['a'],
});

const arrange = (hideDefeated: 0 | 1, logEntries: EncounterLogEntry[]) => {
  getEncounterById.mockResolvedValue(
    buildEncounter({ hide_defeated: hideDefeated }),
  );
  getQueueItems.mockResolvedValue([goblin]);
  getLogEntries.mockResolvedValue(logEntries);
  getAllBaseEntities.mockResolvedValue([]);
};

describe('useEncounterQueueEntries', () => {
  beforeEach(() => {
    queryClient.clear();
  });

  it.each([
    ['encounter', getEncounterById],
    ['queue', getQueueItems],
    ['log', getLogEntries],
    ['entities', getAllBaseEntities],
  ])(
    'keeps entries empty while the %s read is pending, so no HP shows before everything has loaded',
    async (_read, pendingRead) => {
      arrange(0, []);
      const pending = Promise.withResolvers<never>();
      pendingRead.mockReturnValue(pending.promise);

      const { result } = renderHook(() => useEncounterQueueEntries(), {
        wrapper: TanstackQueryClientProvider,
      });
      // Only the pending read is still fetching once the others have settled.
      await waitFor(() => {
        expect(queryClient.isFetching()).toBe(
          pendingRead === getAllBaseEntities ? BASE_ENTITY_TYPES.length : 1,
        );
      });

      expect(result.current).toEqual({ entries: [], loading: true });
    },
  );

  it('shows the entries once every read has loaded', async () => {
    arrange(0, []);

    const { result } = renderHook(() => useEncounterQueueEntries(), {
      wrapper: TanstackQueryClientProvider,
    });
    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.entries).toHaveLength(1);
  });

  it.each([
    { hideDefeated: 1 as const, expectedIds: [] },
    { hideDefeated: 0 as const, expectedIds: ['a'] },
  ])(
    'shows the ids $expectedIds of a defeated combatant when hide_defeated is $hideDefeated',
    async ({ hideDefeated, expectedIds }) => {
      arrange(hideDefeated, [defeatedEntry]);

      const { result } = renderHook(() => useEncounterQueueEntries(), {
        wrapper: TanstackQueryClientProvider,
      });
      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.entries.map((entry) => entry.id)).toEqual(
        expectedIds,
      );
    },
  );
});
