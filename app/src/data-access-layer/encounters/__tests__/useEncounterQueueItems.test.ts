import { createElement, type ReactNode } from 'react';
import { act, renderHook } from '@testing-library/react';
import { QueryClientProvider } from '@tanstack/react-query';
import { ErrorBoundary } from 'react-error-boundary';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { EncounterQueueItem } from '@db/encounter-queue-item';
import { buildEncounterQueueItem } from '@/__tests__/support/buildEncounterQueueItem';
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
      adder: useEncounterQueueItems('encounter-1'),
      sibling: useEncounterQueueItems('encounter-1'),
      other: useEncounterQueueItems('encounter-2'),
    }));
    await settle(0);

    act(() => {
      void result.current.adder.addEntityCombatants('foes', 'entity-1', 2);
    });

    await settle(0);

    expect(result.current.sibling.isAdding).toBe(true);
    expect(result.current.other.isAdding).toBe(false);

    resolveAdd();
    await settle(0);

    expect(result.current.sibling.isAdding).toBe(false);
  });

  it('calls the service once for a second add in the same call stack as the first', async () => {
    withDeferredAdd();
    const { result } = renderHookWithQueryClient(() => ({
      first: useEncounterQueueItems('encounter-1'),
      second: useEncounterQueueItems('encounter-1'),
    }));
    await settle(0);

    act(() => {
      void result.current.first.addEntityCombatants('foes', 'entity-1', 1);
      void result.current.second.addEntityCombatants('foes', 'entity-1', 1);
    });
    await settle(0);

    expect(addEntityCombatants).toHaveBeenCalledTimes(1);
    expect(addEntityCombatants).toHaveBeenCalledWith(
      'encounter-1',
      'foes',
      'entity-1',
      1,
    );
  });

  it('invalidates the queue of the encounter once an add resolved', async () => {
    const { result, invalidateQueries } = renderHookWithQueryClient(() =>
      useEncounterQueueItems('encounter-1'),
    );
    await settle(0);

    await act(() => result.current.addEntityCombatants('foes', 'entity-1', 1));

    expect(invalidateQueries).toHaveBeenCalledWith({
      queryKey: encounterKeys.queueItems('encounter-1'),
    });
  });

  it('rewrites the cached sort_order at once and calls the service with the ordered ids', async () => {
    getQueueItems.mockResolvedValue([
      buildEncounterQueueItem({ id: 'a', sort_order: 0 }),
      buildEncounterQueueItem({ id: 'b', sort_order: 1 }),
    ]);
    const { result, queryClient } = renderHookWithQueryClient(() =>
      useEncounterQueueItems('encounter-1'),
    );
    await settle(0);

    act(() => {
      result.current.reorderQueueItems(['b', 'a']);
    });

    expect(
      queryClient
        .getQueryData<EncounterQueueItem[]>(
          encounterKeys.queueItems('encounter-1'),
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
    const { result } = renderHook(() => useEncounterQueueItems('encounter-1'), {
      wrapper,
    });
    await settle(0);

    act(() => {
      result.current.reorderQueueItems(['b', 'a']);
    });
    await settle(0);

    expect(invalidateQueries).toHaveBeenCalledWith({
      queryKey: encounterKeys.queueItems('encounter-1'),
    });
  });
  it('exposes an empty queue while the items load', () => {
    getQueueItems.mockReturnValue(new Promise(() => undefined));
    const { result } = renderHookWithQueryClient(() =>
      useEncounterQueueItems('encounter-1'),
    );

    expect(result.current.queueItems).toEqual([]);
    expect(result.current.loading).toBe(true);
  });

  it("still adds while another encounter's add is pending", async () => {
    withDeferredAdd();
    const { result } = renderHookWithQueryClient(() => ({
      first: useEncounterQueueItems('encounter-1'),
      second: useEncounterQueueItems('encounter-2'),
    }));
    await settle(0);

    act(() => {
      void result.current.first.addEntityCombatants('foes', 'entity-1', 1);
    });
    await settle(0);
    act(() => {
      void result.current.second.addEntityCombatants('foes', 'entity-2', 1);
    });
    await settle(0);

    expect(addEntityCombatants.mock.calls.map((call) => call[0])).toEqual([
      'encounter-1',
      'encounter-2',
    ]);
  });

  it('writes the order without touching the cache when the queue is not loaded yet', async () => {
    getQueueItems.mockReturnValue(new Promise(() => undefined));
    const { result, queryClient } = renderHookWithQueryClient(() =>
      useEncounterQueueItems('encounter-1'),
    );

    act(() => {
      result.current.reorderQueueItems(['b', 'a']);
    });
    await settle(0);

    expect(
      queryClient.getQueryData(encounterKeys.queueItems('encounter-1')),
    ).toBeUndefined();
    expect(reorderQueueItems).toHaveBeenCalledWith(['b', 'a']);
  });

  it('drops an id that is not in the cached queue from the rewritten list', async () => {
    getQueueItems.mockResolvedValue([
      buildEncounterQueueItem({ id: 'a', sort_order: 0 }),
      buildEncounterQueueItem({ id: 'b', sort_order: 1 }),
    ]);
    const { result, queryClient } = renderHookWithQueryClient(() =>
      useEncounterQueueItems('encounter-1'),
    );
    await settle(0);

    act(() => {
      result.current.reorderQueueItems(['b', 'ghost', 'a']);
    });

    expect(
      queryClient
        .getQueryData<EncounterQueueItem[]>(
          encounterKeys.queueItems('encounter-1'),
        )
        ?.map((item) => [item.id, item.sort_order]),
    ).toEqual([
      ['b', 0],
      ['a', 2],
    ]);
  });
});
