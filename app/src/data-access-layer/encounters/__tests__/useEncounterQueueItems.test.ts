import { createElement, type ReactNode } from 'react';
import { act, renderHook } from '@testing-library/react';
import { QueryClientProvider, type QueryClient } from '@tanstack/react-query';
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
import { AUTOSAVE_DELAY_MS } from '../../createAutosaveQueue';
import {
  renderHookWithQueryClient,
  settle,
} from '../../__tests__/support/renderHookWithQueryClient';
import { encounterKeys } from '../encounterKeys';
import { useEncounterQueueItems } from '../useEncounterQueueItems';

const getQueueItems = vi.hoisted(() => vi.fn<typeof service.getQueueItems>());
const addEntityCombatant = vi.hoisted(() =>
  vi.fn<typeof service.addEntityCombatant>(),
);
const addRandomCombatant = vi.hoisted(() =>
  vi.fn<typeof service.addRandomCombatant>(),
);
const addEvent = vi.hoisted(() => vi.fn<typeof service.addEvent>());
const reorderQueueItems = vi.hoisted(() =>
  vi.fn<typeof service.reorderQueueItems>(),
);
const updateQueueItem = vi.hoisted(() =>
  vi.fn<typeof service.updateQueueItem>(),
);

vi.mock('@services/encounterQueueService', () => ({
  getQueueItems,
  addEntityCombatant,
  addRandomCombatant,
  addEvent,
  reorderQueueItems,
  updateQueueItem,
}));

const withDeferredAdd = (
  addSpy: {
    mockReturnValue: (value: Promise<void>) => unknown;
  } = addEntityCombatant,
) => {
  let release: (() => void) | null = null;
  addSpy.mockReturnValue(
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
    addEntityCombatant.mockReset().mockResolvedValue();
    addRandomCombatant.mockReset().mockResolvedValue();
    addEvent.mockReset().mockResolvedValue();
    reorderQueueItems.mockReset().mockResolvedValue();
    updateQueueItem.mockReset().mockResolvedValue();
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
      void result.current.adder.addEntityCombatant('foes', BASE_ENTITY_ID);
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
        result.current.first.addEntityCombatant('foes', BASE_ENTITY_ID),
      );
      adds.push(
        result.current.second.addEntityCombatant('foes', BASE_ENTITY_ID),
      );
    });
    await settle(0);
    releaseAdd();
    await settle(0);

    expect(addEntityCombatant).toHaveBeenCalledTimes(1);
    expect(addEntityCombatant).toHaveBeenCalledWith(
      QUEUE_ITEM_ENCOUNTER_ID,
      'foes',
      BASE_ENTITY_ID,
    );
    expect(await Promise.all(adds)).toEqual([true, false]);
  });

  it('invalidates the queue and the log of the encounter once an add resolved', async () => {
    const { result, invalidateQueries } = renderHookWithQueryClient(() =>
      useEncounterQueueItems(QUEUE_ITEM_ENCOUNTER_ID),
    );
    await settle(0);

    const wasAdded = await act(() =>
      result.current.addEntityCombatant('foes', BASE_ENTITY_ID),
    );

    expect(wasAdded).toBe(true);
    expect(invalidateQueries).toHaveBeenCalledWith({
      queryKey: encounterKeys.queueItems(QUEUE_ITEM_ENCOUNTER_ID),
    });
    expect(invalidateQueries).toHaveBeenCalledWith({
      queryKey: encounterKeys.logEntries(QUEUE_ITEM_ENCOUNTER_ID),
    });
  });

  it('keeps isAdding true after the service resolved until the queue and the log have refetched', async () => {
    const { result, invalidateQueries } = renderHookWithQueryClient(() =>
      useEncounterQueueItems(QUEUE_ITEM_ENCOUNTER_ID),
    );
    await settle(0);
    let finishRefetch: () => void = () => undefined;
    invalidateQueries.mockReturnValue(
      new Promise<void>((resolve) => {
        finishRefetch = resolve;
      }),
    );

    act(() => {
      void result.current.addEvent('Lair action');
    });
    await settle(0);
    expect(result.current.isAdding).toBe(true);

    finishRefetch();
    await settle(0);
    expect(result.current.isAdding).toBe(false);
  });

  describe.each([
    [
      'an entity combatant',
      addEntityCombatant,
      (hook: ReturnType<typeof useEncounterQueueItems>) =>
        hook.addEntityCombatant('foes', BASE_ENTITY_ID),
      [QUEUE_ITEM_ENCOUNTER_ID, 'foes', BASE_ENTITY_ID],
    ],
    [
      'a random combatant',
      addRandomCombatant,
      (hook: ReturnType<typeof useEncounterQueueItems>) =>
        hook.addRandomCombatant('Grunt', 10),
      [QUEUE_ITEM_ENCOUNTER_ID, 'Grunt', 10],
    ],
    [
      'an event',
      addEvent,
      (hook: ReturnType<typeof useEncounterQueueItems>) =>
        hook.addEvent('Lair action'),
      [QUEUE_ITEM_ENCOUNTER_ID, 'Lair action'],
    ],
  ] as const)('adding %s', (_label, serviceSpy, run, expectedArguments) => {
    it('calls its service function once for a double call in one call stack and refuses the second', async () => {
      const releaseAdd = withDeferredAdd(serviceSpy);
      const { result } = renderHookWithQueryClient(() => ({
        first: useEncounterQueueItems(QUEUE_ITEM_ENCOUNTER_ID),
        second: useEncounterQueueItems(QUEUE_ITEM_ENCOUNTER_ID),
      }));
      await settle(0);

      const adds: Promise<boolean>[] = [];
      act(() => {
        adds.push(run(result.current.first));
        adds.push(run(result.current.second));
      });
      await settle(0);
      releaseAdd();
      await settle(0);

      expect(serviceSpy).toHaveBeenCalledTimes(1);
      expect(serviceSpy).toHaveBeenCalledWith(...expectedArguments);
      expect(await Promise.all(adds)).toEqual([true, false]);
    });

    it('is refused while an add of each other kind is pending', async () => {
      const releaseAdd = withDeferredAdd(serviceSpy);
      const { result } = renderHookWithQueryClient(() =>
        useEncounterQueueItems(QUEUE_ITEM_ENCOUNTER_ID),
      );
      await settle(0);

      act(() => {
        void run(result.current);
      });
      await settle(0);
      const refused = await act(() =>
        Promise.all([
          result.current.addEntityCombatant('foes', 'entity-2'),
          result.current.addRandomCombatant('Brute', null),
          result.current.addEvent('Other'),
        ]),
      );
      releaseAdd();
      await settle(0);

      // The add under test is refused too: its own call is pending.
      expect(refused).toEqual([false, false, false]);
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
      void result.current.first.addEntityCombatant('foes', BASE_ENTITY_ID);
    });
    await settle(0);
    act(() => {
      void result.current.second.addEntityCombatant('foes', 'entity-2');
    });
    await settle(0);

    expect(addEntityCombatant.mock.calls.map((call) => call[0])).toEqual([
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

  describe('updateQueueItem', () => {
    const cachedFields = (queryClient: QueryClient) =>
      queryClient
        .getQueryData<EncounterQueueItem[]>(
          encounterKeys.queueItems(QUEUE_ITEM_ENCOUNTER_ID),
        )
        ?.map((item) => [item.id, item.custom_name, item.notes]);

    const renderLoaded = async () => {
      getQueueItems.mockResolvedValue([
        buildEncounterQueueItem({ id: 'a' }),
        buildEncounterQueueItem({ id: 'b' }),
      ]);
      const rendered = renderHookWithQueryClient(
        ({ encounterId }: { encounterId: string }) =>
          useEncounterQueueItems(encounterId),
        { initialProps: { encounterId: QUEUE_ITEM_ENCOUNTER_ID } },
      );
      await settle(0);
      return rendered;
    };

    it('writes the edit into the cache at once, for its item only', async () => {
      const { result, queryClient } = await renderLoaded();

      act(() => {
        result.current.updateQueueItem('a', {
          custom_name: 'Boss',
          notes: 'n',
        });
      });

      expect(cachedFields(queryClient)).toEqual([
        ['a', 'Boss', 'n'],
        ['b', null, null],
      ]);
    });

    it('writes an event rename into the cache at once and schedules the save with the name for that item', async () => {
      const { result, queryClient } = await renderLoaded();

      act(() => {
        result.current.updateQueueItem('a', { name: 'Lair' });
      });

      expect(
        queryClient
          .getQueryData<EncounterQueueItem[]>(
            encounterKeys.queueItems(QUEUE_ITEM_ENCOUNTER_ID),
          )
          ?.map((item) => [item.id, item.name]),
      ).toEqual([
        ['a', 'Lair'],
        ['b', 'Goblin'],
      ]);
      await settle(AUTOSAVE_DELAY_MS);
      expect(updateQueueItem).toHaveBeenCalledWith('a', { name: 'Lair' });
    });

    it('schedules the save without touching the cache when the queue is not loaded yet', async () => {
      getQueueItems.mockReturnValue(new Promise(() => undefined));
      const { result, queryClient } = renderHookWithQueryClient(() =>
        useEncounterQueueItems(QUEUE_ITEM_ENCOUNTER_ID),
      );

      act(() => {
        result.current.updateQueueItem('a', { custom_name: 'Boss' });
      });
      await settle(AUTOSAVE_DELAY_MS);

      expect(
        queryClient.getQueryData(
          encounterKeys.queueItems(QUEUE_ITEM_ENCOUNTER_ID),
        ),
      ).toBeUndefined();
      expect(updateQueueItem).toHaveBeenCalledWith('a', {
        custom_name: 'Boss',
      });
    });

    it('writes the scheduled id and data after a re-render for another encounter', async () => {
      const { result, rerender } = await renderLoaded();

      act(() => {
        result.current.updateQueueItem('a', { custom_name: 'Boss' });
      });
      rerender({ encounterId: 'encounter-2' });
      await settle(AUTOSAVE_DELAY_MS);

      expect(updateQueueItem).toHaveBeenCalledTimes(1);
      expect(updateQueueItem).toHaveBeenCalledWith('a', {
        custom_name: 'Boss',
      });
    });

    it('invalidates the queue of the scheduled encounter, not the re-rendered one, when the write fails', async () => {
      getQueueItems.mockResolvedValue([buildEncounterQueueItem({ id: 'a' })]);
      updateQueueItem.mockRejectedValue(new Error('locked'));
      const queryClient = createQueryClient();
      const invalidateQueries = vi.spyOn(queryClient, 'invalidateQueries');
      const wrapper = ({ children }: { children: ReactNode }) =>
        createElement(
          ErrorBoundary,
          { fallback: null },
          createElement(QueryClientProvider, { client: queryClient }, children),
        );
      const { result, rerender } = renderHook(
        ({ encounterId }: { encounterId: string }) =>
          useEncounterQueueItems(encounterId),
        { wrapper, initialProps: { encounterId: QUEUE_ITEM_ENCOUNTER_ID } },
      );
      await settle(0);

      act(() => {
        result.current.updateQueueItem('a', { custom_name: 'Boss' });
      });
      rerender({ encounterId: 'encounter-2' });
      await settle(AUTOSAVE_DELAY_MS);

      expect(invalidateQueries).toHaveBeenCalledTimes(1);
      expect(invalidateQueries).toHaveBeenCalledWith({
        queryKey: encounterKeys.queueItems(QUEUE_ITEM_ENCOUNTER_ID),
      });
    });

    it('sends two edits to one item as one merged write', async () => {
      const { result } = await renderLoaded();

      act(() => {
        result.current.updateQueueItem('a', { custom_name: 'Boss' });
      });
      act(() => {
        result.current.updateQueueItem('a', { notes: 'n' });
      });
      await settle(AUTOSAVE_DELAY_MS);

      expect(updateQueueItem).toHaveBeenCalledTimes(1);
      expect(updateQueueItem).toHaveBeenCalledWith('a', {
        custom_name: 'Boss',
        notes: 'n',
      });
    });

    it('sends a null rename that follows text as null', async () => {
      const { result, queryClient } = await renderLoaded();

      act(() => {
        result.current.updateQueueItem('a', { custom_name: 'Boss' });
      });
      act(() => {
        result.current.updateQueueItem('a', { custom_name: null });
      });
      await settle(AUTOSAVE_DELAY_MS);

      expect(updateQueueItem).toHaveBeenCalledWith('a', { custom_name: null });
      expect(cachedFields(queryClient)?.[0]).toEqual(['a', null, null]);
    });

    it('invalidates nothing after a successful save', async () => {
      const { result, invalidateQueries } = await renderLoaded();

      act(() => {
        result.current.updateQueueItem('a', { custom_name: 'Boss' });
      });
      await settle(AUTOSAVE_DELAY_MS);

      expect(updateQueueItem).toHaveBeenCalledTimes(1);
      expect(invalidateQueries).not.toHaveBeenCalled();
    });
  });
});
