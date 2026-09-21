import { act } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { SessionStep } from '@db/session-step';
import type * as service from '@services/sessionStepService';
import { AUTOSAVE_DELAY_MS } from '../../createAutosaveQueue';
import {
  renderHookWithQueryClient,
  settle,
} from '../../__tests__/support/renderHookWithQueryClient';
import { useSessionSteps } from '../useSessionSteps';

const getStepsBySessionId = vi.hoisted(() =>
  vi.fn<typeof service.getStepsBySessionId>(),
);
const updateStep = vi.hoisted(() => vi.fn<typeof service.updateStep>());

vi.mock('@services/sessionStepService', () => ({
  getStepsBySessionId,
  updateStep,
}));

const stepRow = (sessionId: string): SessionStep => ({
  id: 'step-1',
  session_id: sessionId,
  name: null,
  content: null,
  default_step_key: null,
  checked: 0,
  sort_order: 0,
  created_at: '2026-01-10T09:00:00.000Z',
  updated_at: '2026-01-10T09:00:00.000Z',
});

const renderSteps = async () => {
  const rendered = renderHookWithQueryClient(
    ({ sessionId }: { sessionId: string }) => useSessionSteps(sessionId),
    { initialProps: { sessionId: 'session-1' } },
  );
  await settle(0);
  return rendered;
};

describe('useSessionSteps', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    getStepsBySessionId.mockImplementation((sessionId) =>
      Promise.resolve([stepRow(sessionId)]),
    );
    updateStep.mockResolvedValue(undefined);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('writes the scheduled step and its data after a re-render for another session', async () => {
    const { result, rerender } = await renderSteps();

    act(() => {
      result.current.updateStep('step-1', { name: 'n' });
    });
    rerender({ sessionId: 'session-2' });
    await settle(AUTOSAVE_DELAY_MS);

    expect(updateStep).toHaveBeenCalledTimes(1);
    expect(updateStep).toHaveBeenCalledWith('step-1', { name: 'n' });
  });

  it('invalidates nothing when a step save completes', async () => {
    const { result, rerender, invalidateQueries } = await renderSteps();

    act(() => {
      result.current.updateStep('step-1', { name: 'n' });
    });
    rerender({ sessionId: 'session-2' });
    await settle(AUTOSAVE_DELAY_MS);

    expect(invalidateQueries).not.toHaveBeenCalled();
  });

  it("keeps an earlier edit's value when a later edit to the same step leaves it undefined", async () => {
    const { result } = await renderSteps();

    act(() => {
      result.current.updateStep('step-1', { content: 'kept' });
    });
    act(() => {
      result.current.updateStep('step-1', { name: 'n', content: undefined });
    });
    await settle(AUTOSAVE_DELAY_MS);

    expect(updateStep).toHaveBeenCalledTimes(1);
    expect(updateStep).toHaveBeenCalledWith('step-1', {
      content: 'kept',
      name: 'n',
    });
  });
});
