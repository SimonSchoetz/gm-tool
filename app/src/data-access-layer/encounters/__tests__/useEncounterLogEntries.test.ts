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

vi.mock('@services/encounterLogEntryService', () => ({
  getLogEntries,
  recordLogEntry,
}));

const DAMAGE = { targets: [{ queueItemId: 'item-1', amount: 3 }] };

const withDeferredRecord = () => {
  let release: (() => void) | null = null;
  recordLogEntry.mockReturnValue(
    new Promise<void>((resolve) => {
      release = resolve;
    }),
  );
  return () => {
    release?.();
  };
};

describe('useEncounterLogEntries', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    getLogEntries.mockReset().mockResolvedValue([]);
    recordLogEntry.mockReset().mockResolvedValue();
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

    expect(result.current.sibling.isRecording).toBe(true);
    expect(result.current.other.isRecording).toBe(false);

    resolveWrite();
    await settle(0);

    expect(result.current.sibling.isRecording).toBe(false);
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
    expect(result.current.isRecording).toBe(true);

    refetch.resolve([]);
    await settle(0);

    expect(result.current.isRecording).toBe(false);
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
});
