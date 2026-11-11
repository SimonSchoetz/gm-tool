import { act } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { Session } from '@db/session';
import type * as service from '@services/sessionService';
import { AUTOSAVE_DELAY_MS } from '../../createAutosaveQueue';
import {
  renderHookWithQueryClient,
  settle,
} from '../../__tests__/support/renderHookWithQueryClient';
import { sessionKeys } from '../sessionKeys';
import { useSession } from '../useSession';

const getSessionById = vi.hoisted(() => vi.fn<typeof service.getSessionById>());
const updateSession = vi.hoisted(() => vi.fn<typeof service.updateSession>());

const deleteSession = vi.hoisted(() => vi.fn<typeof service.deleteSession>());
const duplicateSession = vi.hoisted(() =>
  vi.fn<typeof service.duplicateSession>(),
);

vi.mock('@services/sessionService', () => ({
  getSessionById,
  updateSession,
  deleteSession,
  duplicateSession,
}));

const sessionRow = (id: string): Session => ({
  id,
  name: null,
  description: null,
  summary: null,
  session_date: null,
  active_view: 'prep',
  adventure_id: 'adventure-1',
  pinned_order: null,
  created_at: '2026-01-10T09:00:00.000Z',
  updated_at: '2026-01-10T09:00:00.000Z',
});

const renderSession = async () => {
  const rendered = renderHookWithQueryClient(
    ({ sessionId, adventureId }: { sessionId: string; adventureId: string }) =>
      useSession(sessionId, adventureId),
    { initialProps: { sessionId: 'session-1', adventureId: 'adventure-1' } },
  );
  await settle(0);
  return rendered;
};

describe('useSession', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    getSessionById.mockImplementation((id) => Promise.resolve(sessionRow(id)));
    updateSession.mockResolvedValue(undefined);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('writes the scheduled session and its data after a re-render for another session', async () => {
    const { result, rerender } = await renderSession();

    act(() => {
      result.current.updateSession({ name: 'n' });
    });
    rerender({ sessionId: 'session-2', adventureId: 'adventure-2' });
    await settle(AUTOSAVE_DELAY_MS);

    expect(updateSession).toHaveBeenCalledTimes(1);
    expect(updateSession).toHaveBeenCalledWith('session-1', { name: 'n' });
  });

  it("invalidates the scheduled session and its adventure's list after a re-render for another adventure", async () => {
    const { result, rerender, invalidateQueries } = await renderSession();

    act(() => {
      result.current.updateSession({ name: 'n' });
    });
    rerender({ sessionId: 'session-2', adventureId: 'adventure-2' });
    await settle(AUTOSAVE_DELAY_MS);

    expect(invalidateQueries).toHaveBeenCalledTimes(2);
    expect(invalidateQueries).toHaveBeenCalledWith({
      queryKey: sessionKeys.detail('session-1'),
    });
    expect(invalidateQueries).toHaveBeenCalledWith({
      queryKey: sessionKeys.list('adventure-1'),
    });
  });

  it("keeps an earlier edit's value when a later edit to the same session leaves it undefined", async () => {
    const { result } = await renderSession();

    act(() => {
      result.current.updateSession({ description: 'kept' });
    });
    act(() => {
      result.current.updateSession({ name: 'n', description: undefined });
    });
    await settle(AUTOSAVE_DELAY_MS);

    expect(updateSession).toHaveBeenCalledTimes(1);
    expect(updateSession).toHaveBeenCalledWith('session-1', {
      description: 'kept',
      name: 'n',
    });
  });
});

describe('useSession data', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    getSessionById.mockImplementation((id) => Promise.resolve(sessionRow(id)));
    updateSession.mockReset().mockResolvedValue(undefined);
    deleteSession.mockReset().mockResolvedValue(undefined);
    duplicateSession.mockReset().mockResolvedValue('copied-session');
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('reports no session and loading until it has loaded, then the loaded session', async () => {
    const { result } = renderHookWithQueryClient(
      ({
        sessionId,
        adventureId,
      }: {
        sessionId: string;
        adventureId: string;
      }) => useSession(sessionId, adventureId),
      { initialProps: { sessionId: 'session-1', adventureId: 'adventure-1' } },
    );

    expect(result.current.session).toBeNull();
    expect(result.current.loading).toBe(true);

    await settle(0);

    expect(result.current.session?.id).toBe('session-1');
    expect(result.current.loading).toBe(false);
  });

  it('shows an edit at once in the cached session and in that session only of the cached list', async () => {
    const { result, queryClient } = await renderSession();
    queryClient.setQueryData<Session[]>(sessionKeys.list('adventure-1'), [
      sessionRow('session-1'),
      sessionRow('session-2'),
    ]);

    act(() => {
      result.current.updateSession({ name: 'Renamed' });
    });
    await settle(0);

    expect(result.current.session?.name).toBe('Renamed');
    expect(
      queryClient
        .getQueryData<Session[]>(sessionKeys.list('adventure-1'))
        ?.map((session) => [session.id, session.name]),
    ).toEqual([
      ['session-1', 'Renamed'],
      ['session-2', null],
    ]);
  });

  it('leaves an adventure list that is not cached uncached when a session is edited', async () => {
    const { result, queryClient } = await renderSession();

    act(() => {
      result.current.updateSession({ name: 'Renamed' });
    });
    await settle(0);

    expect(
      queryClient.getQueryData(sessionKeys.list('adventure-1')),
    ).toBeUndefined();
  });

  it('schedules no save and changes nothing before the session has loaded', async () => {
    getSessionById.mockImplementation(
      () => new Promise<Session>(() => undefined),
    );
    const { result, queryClient } = renderHookWithQueryClient(
      ({
        sessionId,
        adventureId,
      }: {
        sessionId: string;
        adventureId: string;
      }) => useSession(sessionId, adventureId),
      { initialProps: { sessionId: 'session-1', adventureId: 'adventure-1' } },
    );

    act(() => {
      result.current.updateSession({ name: 'x' });
    });
    await settle(AUTOSAVE_DELAY_MS);

    expect(updateSession).not.toHaveBeenCalled();
    expect(
      queryClient.getQueryData(sessionKeys.detail('session-1')),
    ).toBeUndefined();
  });

  it('deletes the session and invalidates the list of its adventure', async () => {
    const { result, invalidateQueries } = await renderSession();

    await act(async () => {
      await result.current.deleteSession();
    });

    expect(deleteSession).toHaveBeenCalledWith('session-1');
    expect(invalidateQueries).toHaveBeenCalledWith({
      queryKey: sessionKeys.list('adventure-1'),
    });
  });

  it('duplicates the session, resolves the id of the copy and invalidates only the list', async () => {
    const { result, invalidateQueries } = await renderSession();

    let copyId = '';
    await act(async () => {
      copyId = await result.current.duplicateSession();
    });

    expect(copyId).toBe('copied-session');
    expect(duplicateSession).toHaveBeenCalledWith('session-1');
    expect(invalidateQueries.mock.calls).toEqual([
      [{ queryKey: sessionKeys.list('adventure-1') }],
    ]);
  });
});
