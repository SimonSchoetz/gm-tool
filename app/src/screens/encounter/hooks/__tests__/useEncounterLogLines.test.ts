import { renderHook, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { BASE_ENTITY_TYPES } from '@domain';
import type * as baseEntityService from '@services/baseEntityService';
import type * as logEntryService from '@services/encounterLogEntryService';
import type * as queueService from '@services/encounterQueueService';
import { buildEncounterLogEntry } from '@/__tests__/support/buildEncounterLogEntry';
import { buildEncounterQueueItem } from '@/__tests__/support/buildEncounterQueueItem';
import { queryClient, TanstackQueryClientProvider } from '@/data-access-layer';
import { useEncounterLogLines } from '../useEncounterLogLines';

const getAllBaseEntities = vi.hoisted(() =>
  vi.fn<typeof baseEntityService.getAllBaseEntities>(),
);
const getLogEntries = vi.hoisted(() =>
  vi.fn<typeof logEntryService.getLogEntries>(),
);
const getQueueItems = vi.hoisted(() =>
  vi.fn<typeof queueService.getQueueItems>(),
);

vi.mock('@services/baseEntityService', () => ({ getAllBaseEntities }));
vi.mock('@services/encounterLogEntryService', () => ({ getLogEntries }));
vi.mock('@services/encounterQueueService', () => ({ getQueueItems }));

vi.mock('@tanstack/react-router', async () => {
  const { encounterRouteParams } =
    await import('@/__tests__/support/encounterRouteParams');
  return { useParams: encounterRouteParams };
});

const arrange = () => {
  getQueueItems.mockResolvedValue([
    buildEncounterQueueItem({ id: 'a', name: 'Goblin' }),
  ]);
  getLogEntries.mockResolvedValue([
    buildEncounterLogEntry('removed', { queueItemIds: ['a'] }),
  ]);
  getAllBaseEntities.mockResolvedValue([]);
};

describe('useEncounterLogLines', () => {
  beforeEach(() => {
    queryClient.clear();
  });

  it.each([
    ['queue', getQueueItems],
    ['log', getLogEntries],
    ['entities', getAllBaseEntities],
  ])(
    'keeps lines empty while the %s read is pending, so no partial log shows',
    async (_read, pendingRead) => {
      arrange();
      const pending = Promise.withResolvers<never>();
      pendingRead.mockReturnValue(pending.promise);

      const { result } = renderHook(() => useEncounterLogLines(), {
        wrapper: TanstackQueryClientProvider,
      });
      // Only the pending read is still fetching once the others have settled.
      await waitFor(() => {
        expect(queryClient.isFetching()).toBe(
          pendingRead === getAllBaseEntities ? BASE_ENTITY_TYPES.length : 1,
        );
      });

      expect(result.current).toEqual({ lines: [], loading: true });
    },
  );

  it('builds the lines once every read has loaded', async () => {
    arrange();

    const { result } = renderHook(() => useEncounterLogLines(), {
      wrapper: TanstackQueryClientProvider,
    });
    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.lines).toEqual([
      expect.objectContaining({ kind: 'automatic', text: 'Removed: Goblin' }),
    ]);
  });
});
