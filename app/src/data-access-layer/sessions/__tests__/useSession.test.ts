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

vi.mock('@services/sessionService', () => ({ getSessionById, updateSession }));

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
