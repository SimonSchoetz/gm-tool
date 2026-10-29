import { createElement, type ReactNode } from 'react';
import { act, renderHook } from '@testing-library/react';
import { QueryClientProvider } from '@tanstack/react-query';
import { ErrorBoundary } from 'react-error-boundary';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { EncounterQueueItem } from '@db/encounter-queue-item';
import { BASE_ENTITY_ID } from '@/__tests__/support/buildBaseEntity';
import {
  QUEUE_ITEM_ENCOUNTER_ID,
  buildEncounterQueueItem,
} from '@/__tests__/support/buildEncounterQueueItem';
import type * as service from '@services/encounterQueueService';
import { createQueryClient } from '../../queryClient';
import {
  renderHookWithQueryClient,
  settle,
} from '../../__tests__/support/renderHookWithQueryClient';
import { encounterKeys } from '../encounterKeys';
import { useEncounterQueueItems } from '../useEncounterQueueItems';

const getQueueItems = vi.hoisted(() => vi.fn<typeof service.getQueueItems>());
const addEntityCombatants = vi.hoisted(() =>
  vi.fn<typeof service.addEntityCombatants>(),
);
const reorderQueueItems = vi.hoisted(() =>
  vi.fn<typeof service.reorderQueueItems>(),
);

vi.mock('@services/encounterQueueService', () => ({
  getQueueItems,
  addEntityCombatants,
  reorderQueueItems,
}));

const withDeferredAdd = () => {
  let release: (() => void) | null = null;
  addEntityCombatants.mockReturnValue(
    new Promise<void>((resolve) => {
      release = resolve;
    }),
  );
  return () => {
    release?.();
  };
};

describe('useEncounterQueueItems', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    getQueueItems.mockResolvedValue([]);
    addEntityCombatants.mockReset().mockResolvedValue();
    reorderQueueItems.mockReset().mockResolvedValue();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("disables every hook instance of the encounter while an add is pending, not another encounter's, and enables them again after it resolves", async () => {
    const resolveAdd = withDeferredAdd();
    const { result } = renderHookWithQueryClient(() => ({
      adder: useEncounterQueueItems(QUEUE_ITEM_ENCOUNTER_ID),
      sibling: useEncounterQueueItems(QUEUE_ITEM_ENCOUNTER_ID),
      other: useEncounterQueueItems('encounter-2'),
    }));
    await settle(0);

    act(() => {
      void result.current.adder.addEntityCombatants('foes', BASE_ENTITY_ID, 2);
    });

    await settle(0);

    expect(result.current.sibling.isAdding).toBe(true);
    expect(result.current.other.isAdding).toBe(false);

    resolveAdd();
    await settle(0);

    expect(result.current.sibling.isAdding).toBe(false);
  });

  it('calls the service once for a second add in the same call stack as the first and reports that it was refused', async () => {
    const releaseAdd = withDeferredAdd();
    const { result } = renderHookWithQueryClient(() => ({
      first: useEncounterQueueItems(QUEUE_ITEM_ENCOUNTER_ID),
      second: useEncounterQueueItems(QUEUE_ITEM_ENCOUNTER_ID),
    }));
    await settle(0);

    const adds: Promise<boolean>[] = [];
    act(() => {
      adds.push(
        result.current.first.addEntityCombatants('foes', BASE_ENTITY_ID, 1),
      );
      adds.push(
        result.current.second.addEntityCombatants('foes', BASE_ENTITY_ID, 1),
      );
    });
    await settle(0);
    releaseAdd();
    await settle(0);

    expect(addEntityCombatants).toHaveBeenCalledTimes(1);
    expect(addEntityCombatants).toHaveBeenCalledWith(
      QUEUE_ITEM_ENCOUNTER_ID,
      'foes',
      BASE_ENTITY_ID,
      1,
    );
    expect(await Promise.all(adds)).toEqual([true, false]);
  });

  it('invalidates the queue of the encounter once an add resolved', async () => {
    const { result, invalidateQueries } = renderHookWithQueryClient(() =>
      useEncounterQueueItems(QUEUE_ITEM_ENCOUNTER_ID),
    );
    await settle(0);

    const wasAdded = await act(() =>
      result.current.addEntityCombatants('foes', BASE_ENTITY_ID, 1),
    );

    expect(wasAdded).toBe(true);
    expect(invalidateQueries).toHaveBeenCalledWith({
      queryKey: encounterKeys.queueItems(QUEUE_ITEM_ENCOUNTER_ID),
    });
  });

  it('rewrites the cached sort_order at once and calls the service with the ordered ids', async () => {
    getQueueItems.mockResolvedValue([
      buildEncounterQueueItem({ id: 'a', sort_order: 0 }),
      buildEncounterQueueItem({ id: 'b', sort_order: 1 }),
    ]);
    const { result, queryClient } = renderHookWithQueryClient(() =>
      useEncounterQueueItems(QUEUE_ITEM_ENCOUNTER_ID),
    );
    await settle(0);

    act(() => {
      result.current.reorderQueueItems(['b', 'a']);
    });

    expect(
      queryClient
        .getQueryData<EncounterQueueItem[]>(
          encounterKeys.queueItems(QUEUE_ITEM_ENCOUNTER_ID),
        )
        ?.map((item) => [item.id, item.sort_order]),
    ).toEqual([
      ['b', 0],
      ['a', 1],
    ]);
    await settle(0);
    expect(reorderQueueItems).toHaveBeenCalledWith(['b', 'a']);
  });

  it('invalidates the queue of the encounter when the reorder write rejects', async () => {
    getQueueItems.mockResolvedValue([
      buildEncounterQueueItem({ id: 'a', sort_order: 0 }),
      buildEncounterQueueItem({ id: 'b', sort_order: 1 }),
    ]);
    reorderQueueItems.mockRejectedValue(new Error('locked'));
    const queryClient = createQueryClient();
    const invalidateQueries = vi.spyOn(queryClient, 'invalidateQueries');
    const wrapper = ({ children }: { children: ReactNode }) =>
      createElement(
        ErrorBoundary,
        { fallback: null },
        createElement(QueryClientProvider, { client: queryClient }, children),
      );
    const { result } = renderHook(
      () => useEncounterQueueItems(QUEUE_ITEM_ENCOUNTER_ID),
      {
        wrapper,
      },
    );
    await settle(0);

    act(() => {
      result.current.reorderQueueItems(['b', 'a']);
    });
    await settle(0);

    expect(invalidateQueries).toHaveBeenCalledWith({
      queryKey: encounterKeys.queueItems(QUEUE_ITEM_ENCOUNTER_ID),
    });
  });

  it('exposes an empty queue while the items load', () => {
    getQueueItems.mockReturnValue(new Promise(() => undefined));
    const { result } = renderHookWithQueryClient(() =>
      useEncounterQueueItems(QUEUE_ITEM_ENCOUNTER_ID),
    );

    expect(result.current.queueItems).toEqual([]);
    expect(result.current.loading).toBe(true);
  });

  it("still adds while another encounter's add is pending", async () => {
    withDeferredAdd();
    const { result } = renderHookWithQueryClient(() => ({
      first: useEncounterQueueItems(QUEUE_ITEM_ENCOUNTER_ID),
      second: useEncounterQueueItems('encounter-2'),
    }));
    await settle(0);

    act(() => {
      void result.current.first.addEntityCombatants('foes', BASE_ENTITY_ID, 1);
    });
    await settle(0);
    act(() => {
      void result.current.second.addEntityCombatants('foes', 'entity-2', 1);
    });
    await settle(0);

    expect(addEntityCombatants.mock.calls.map((call) => call[0])).toEqual([
      QUEUE_ITEM_ENCOUNTER_ID,
      'encounter-2',
    ]);
  });

  it('writes the order without touching the cache when the queue is not loaded yet', async () => {
    getQueueItems.mockReturnValue(new Promise(() => undefined));
    const { result, queryClient } = renderHookWithQueryClient(() =>
      useEncounterQueueItems(QUEUE_ITEM_ENCOUNTER_ID),
    );

    act(() => {
      result.current.reorderQueueItems(['b', 'a']);
    });
    await settle(0);

    expect(
      queryClient.getQueryData(
        encounterKeys.queueItems(QUEUE_ITEM_ENCOUNTER_ID),
      ),
    ).toBeUndefined();
    expect(reorderQueueItems).toHaveBeenCalledWith(['b', 'a']);
  });

  it('drops an id that is not in the cached queue from the rewritten list', async () => {
    getQueueItems.mockResolvedValue([
      buildEncounterQueueItem({ id: 'a', sort_order: 0 }),
      buildEncounterQueueItem({ id: 'b', sort_order: 1 }),
    ]);
    const { result, queryClient } = renderHookWithQueryClient(() =>
      useEncounterQueueItems(QUEUE_ITEM_ENCOUNTER_ID),
    );
    await settle(0);

    act(() => {
      result.current.reorderQueueItems(['b', 'ghost', 'a']);
    });

    expect(
      queryClient
        .getQueryData<EncounterQueueItem[]>(
          encounterKeys.queueItems(QUEUE_ITEM_ENCOUNTER_ID),
        )
        ?.map((item) => [item.id, item.sort_order]),
    ).toEqual([
      ['b', 0],
      ['a', 2],
    ]);
  });
});
