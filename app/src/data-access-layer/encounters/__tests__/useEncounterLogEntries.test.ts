import { act } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { EncounterLogEntry } from '@db/encounter-log-entry';
import type * as service from '@services/encounterLogEntryService';
import {
  renderHookWithQueryClient,
  settle,
} from '../../__tests__/support/renderHookWithQueryClient';
import { encounterKeys } from '../encounterKeys';
import { useEncounterLogEntries } from '../useEncounterLogEntries';

const getLogEntries = vi.hoisted(() => vi.fn<typeof service.getLogEntries>());
const recordLogEntry = vi.hoisted(() => vi.fn<typeof service.recordLogEntry>());
const deleteLogMessage = vi.hoisted(() =>
  vi.fn<typeof service.deleteLogMessage>(),
);

vi.mock('@services/encounterLogEntryService', () => ({
  getLogEntries,
  recordLogEntry,
  deleteLogMessage,
}));

const DAMAGE = { targets: [{ queueItemId: 'item-1', amount: 3 }] };

const withDeferredWrite = (spy: {
  mockReturnValue: (value: Promise<void>) => unknown;
}) => {
  let release: (() => void) | null = null;
  spy.mockReturnValue(
    new Promise<void>((resolve) => {
      release = resolve;
    }),
  );
  return () => {
    release?.();
  };
};
const withDeferredRecord = () => withDeferredWrite(recordLogEntry);

describe('useEncounterLogEntries', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    getLogEntries.mockReset().mockResolvedValue([]);
    recordLogEntry.mockReset().mockResolvedValue();
    deleteLogMessage.mockReset().mockResolvedValue();
  });

  it("reports recording on every hook instance of the encounter while a write is pending, not on another encounter's, and clears it after the write resolves", async () => {
    const resolveWrite = withDeferredRecord();
    const { result } = renderHookWithQueryClient(() => ({
      writer: useEncounterLogEntries('encounter-1'),
      sibling: useEncounterLogEntries('encounter-1'),
      other: useEncounterLogEntries('encounter-2'),
    }));
    await settle(0);

    act(() => {
      void result.current.writer.recordLogEntry('damage', DAMAGE);
    });
    await settle(0);

    expect(result.current.sibling.isWriting).toBe(true);
    expect(result.current.other.isWriting).toBe(false);

    resolveWrite();
    await settle(0);

    expect(result.current.sibling.isWriting).toBe(false);
  });

  it('calls the service once for a second record in the same call stack and reports that it was refused', async () => {
    const resolveWrite = withDeferredRecord();
    const { result } = renderHookWithQueryClient(() => ({
      first: useEncounterLogEntries('encounter-1'),
      second: useEncounterLogEntries('encounter-1'),
    }));
    await settle(0);

    const records: Promise<boolean>[] = [];
    act(() => {
      records.push(result.current.first.recordLogEntry('damage', DAMAGE));
      records.push(result.current.second.recordLogEntry('damage', DAMAGE));
    });
    await settle(0);
    resolveWrite();
    await settle(0);

    expect(recordLogEntry).toHaveBeenCalledTimes(1);
    expect(recordLogEntry).toHaveBeenCalledWith(
      'encounter-1',
      'damage',
      DAMAGE,
    );
    expect(await Promise.all(records)).toEqual([true, false]);
  });

  it('keeps recording until the log refetch has resolved, so the buttons never re-enable on stale HP', async () => {
    const { result } = renderHookWithQueryClient(() =>
      useEncounterLogEntries('encounter-1'),
    );
    await settle(0);
    const refetch = Promise.withResolvers<EncounterLogEntry[]>();
    getLogEntries.mockReturnValue(refetch.promise);

    act(() => {
      void result.current.recordLogEntry('damage', DAMAGE);
    });
    await settle(0);

    expect(recordLogEntry).toHaveBeenCalledTimes(1);
    expect(result.current.isWriting).toBe(true);

    refetch.resolve([]);
    await settle(0);

    expect(result.current.isWriting).toBe(false);
  });

  it('invalidates the log of the encounter after a write', async () => {
    const { result, invalidateQueries } = renderHookWithQueryClient(() =>
      useEncounterLogEntries('encounter-1'),
    );
    await settle(0);

    await act(() => result.current.recordLogEntry('damage', DAMAGE));

    expect(invalidateQueries).toHaveBeenCalledWith({
      queryKey: encounterKeys.logEntries('encounter-1'),
    });
  });

  it("still records while another encounter's write is pending", async () => {
    const resolveWrite = withDeferredRecord();
    const { result } = renderHookWithQueryClient(() => ({
      pending: useEncounterLogEntries('encounter-2'),
      current: useEncounterLogEntries('encounter-1'),
    }));
    await settle(0);
    act(() => {
      void result.current.pending.recordLogEntry('damage', DAMAGE);
    });
    await settle(0);
    recordLogEntry.mockResolvedValue();

    let wasRecorded = false;
    await act(async () => {
      wasRecorded = await result.current.current.recordLogEntry(
        'damage',
        DAMAGE,
      );
    });

    expect(recordLogEntry).toHaveBeenCalledTimes(2);
    expect(wasRecorded).toBe(true);
    resolveWrite();
  });

  it('exposes an empty log while the entries load', () => {
    getLogEntries.mockReturnValue(new Promise(() => undefined));
    const { result } = renderHookWithQueryClient(() =>
      useEncounterLogEntries('encounter-1'),
    );

    expect(result.current.logEntries).toEqual([]);
    expect(result.current.loading).toBe(true);
  });

  it('deletes the named message once and invalidates the log of the encounter', async () => {
    const { result, invalidateQueries } = renderHookWithQueryClient(() =>
      useEncounterLogEntries('encounter-1'),
    );
    await settle(0);

    let wasDeleted = false;
    await act(async () => {
      wasDeleted = await result.current.deleteLogMessage('entry-9');
    });

    expect(deleteLogMessage).toHaveBeenCalledTimes(1);
    expect(deleteLogMessage).toHaveBeenCalledWith('entry-9');
    expect(wasDeleted).toBe(true);
    expect(invalidateQueries).toHaveBeenCalledWith({
      queryKey: encounterKeys.logEntries('encounter-1'),
    });
  });

  it('calls the service once for a second delete in the same call stack and reports that it was refused', async () => {
    const resolveDelete = withDeferredWrite(deleteLogMessage);
    const { result } = renderHookWithQueryClient(() => ({
      first: useEncounterLogEntries('encounter-1'),
      second: useEncounterLogEntries('encounter-1'),
    }));
    await settle(0);

    const deletes: Promise<boolean>[] = [];
    act(() => {
      deletes.push(result.current.first.deleteLogMessage('entry-1'));
      deletes.push(result.current.second.deleteLogMessage('entry-1'));
    });
    await settle(0);
    resolveDelete();
    await settle(0);

    expect(deleteLogMessage).toHaveBeenCalledTimes(1);
    expect(await Promise.all(deletes)).toEqual([true, false]);
  });

  it('refuses a delete while a record is pending and a record while a delete is pending', async () => {
    const resolveRecord = withDeferredRecord();
    const { result } = renderHookWithQueryClient(() =>
      useEncounterLogEntries('encounter-1'),
    );
    await settle(0);

    act(() => {
      void result.current.recordLogEntry('damage', DAMAGE);
    });
    await settle(0);

    let deleteResult = true;
    await act(async () => {
      deleteResult = await result.current.deleteLogMessage('entry-1');
    });
    resolveRecord();
    await settle(0);

    const resolveDelete = withDeferredWrite(deleteLogMessage);
    act(() => {
      void result.current.deleteLogMessage('entry-1');
    });
    await settle(0);
    let recordResult = true;
    await act(async () => {
      recordResult = await result.current.recordLogEntry('damage', DAMAGE);
    });
    resolveDelete();
    await settle(0);

    expect(deleteResult).toBe(false);
    expect(recordResult).toBe(false);
    expect(deleteLogMessage).toHaveBeenCalledTimes(1);
    expect(recordLogEntry).toHaveBeenCalledTimes(1);
  });

  it('reports recording on a sibling instance while a delete is pending, until the log refetch has resolved', async () => {
    const { result } = renderHookWithQueryClient(() => ({
      writer: useEncounterLogEntries('encounter-1'),
      sibling: useEncounterLogEntries('encounter-1'),
    }));
    await settle(0);
    const refetch = Promise.withResolvers<EncounterLogEntry[]>();
    getLogEntries.mockReturnValue(refetch.promise);

    act(() => {
      void result.current.writer.deleteLogMessage('entry-1');
    });
    await settle(0);

    expect(result.current.sibling.isWriting).toBe(true);

    refetch.resolve([]);
    await settle(0);

    expect(result.current.sibling.isWriting).toBe(false);
  });
});
