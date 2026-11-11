import { act } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { SessionStep } from '@db/session-step';
import type * as service from '@services/sessionStepService';
import { AUTOSAVE_DELAY_MS } from '../../createAutosaveQueue';
import {
  renderHookWithQueryClient,
  settle,
} from '../../__tests__/support/renderHookWithQueryClient';
import { sessionStepKeys } from '../sessionStepKeys';
import { useSessionSteps } from '../useSessionSteps';

const getStepsBySessionId = vi.hoisted(() =>
  vi.fn<typeof service.getStepsBySessionId>(),
);
const updateStep = vi.hoisted(() => vi.fn<typeof service.updateStep>());
const createCustomStep = vi.hoisted(() =>
  vi.fn<typeof service.createCustomStep>(),
);
const deleteStep = vi.hoisted(() => vi.fn<typeof service.deleteStep>());
const swapStepOrder = vi.hoisted(() => vi.fn<typeof service.swapStepOrder>());
const bulkReorderSteps = vi.hoisted(() =>
  vi.fn<typeof service.bulkReorderSteps>(),
);

vi.mock('@services/sessionStepService', () => ({
  getStepsBySessionId,
  updateStep,
  createCustomStep,
  deleteStep,
  swapStepOrder,
  bulkReorderSteps,
}));

const stepRow = (
  sessionId: string,
  overrides: Partial<SessionStep> = {},
): SessionStep => ({
  id: 'step-1',
  session_id: sessionId,
  name: null,
  content: null,
  default_step_key: null,
  checked: 0,
  collapsed: 0,
  sort_order: 0,
  created_at: '2026-01-10T09:00:00.000Z',
  updated_at: '2026-01-10T09:00:00.000Z',
  ...overrides,
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
    updateStep.mockReset().mockResolvedValue(undefined);
    createCustomStep.mockReset().mockResolvedValue('created-step');
    deleteStep.mockReset().mockResolvedValue(undefined);
    swapStepOrder.mockReset().mockResolvedValue(undefined);
    bulkReorderSteps.mockReset().mockResolvedValue(undefined);
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

const THREE_STEPS = (sessionId: string): SessionStep[] => [
  stepRow(sessionId, { id: 'first', sort_order: 10, name: 'First' }),
  stepRow(sessionId, { id: 'second', sort_order: 20, name: 'Second' }),
  stepRow(sessionId, { id: 'third', sort_order: 30, name: 'Third' }),
];

const renderThreeSteps = async () => {
  getStepsBySessionId.mockImplementation((sessionId) =>
    Promise.resolve(THREE_STEPS(sessionId)),
  );
  return renderSteps();
};

const idsOf = (steps: SessionStep[]) => steps.map((step) => step.id);

describe('useSessionSteps data', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    createCustomStep.mockReset().mockResolvedValue('created-step');
    deleteStep.mockReset().mockResolvedValue(undefined);
    swapStepOrder.mockReset().mockResolvedValue(undefined);
    bulkReorderSteps.mockReset().mockResolvedValue(undefined);
    updateStep.mockReset().mockResolvedValue(undefined);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('reports no steps and loading until the list has loaded, then the loaded steps', async () => {
    getStepsBySessionId.mockImplementation((sessionId) =>
      Promise.resolve(THREE_STEPS(sessionId)),
    );
    const { result } = renderHookWithQueryClient(
      ({ sessionId }: { sessionId: string }) => useSessionSteps(sessionId),
      { initialProps: { sessionId: 'session-1' } },
    );

    expect(result.current.steps).toEqual([]);
    expect(result.current.loading).toBe(true);

    await settle(0);

    expect(idsOf(result.current.steps)).toEqual(['first', 'second', 'third']);
    expect(result.current.loading).toBe(false);
  });

  it('shows an edit at once in the cached step, leaves the other steps as they are', async () => {
    const { result } = await renderThreeSteps();

    act(() => {
      result.current.updateStep('second', { name: 'Renamed' });
    });
    await settle(0);

    expect(result.current.steps.map((step) => step.name)).toEqual([
      'First',
      'Renamed',
      'Third',
    ]);
  });

  it('creates a custom step for the session with the name and invalidates the session list', async () => {
    const { result, invalidateQueries } = await renderThreeSteps();

    let createdId = '';
    await act(async () => {
      createdId = await result.current.createStep('Extra');
    });

    expect(createdId).toBe('created-step');
    expect(createCustomStep).toHaveBeenCalledWith('session-1', 'Extra');
    expect(invalidateQueries).toHaveBeenCalledWith({
      queryKey: sessionStepKeys.list('session-1'),
    });
  });

  it('deletes the step by id and invalidates the session list', async () => {
    const { result, invalidateQueries } = await renderThreeSteps();

    await act(async () => {
      await result.current.deleteStep('second');
    });

    expect(deleteStep).toHaveBeenCalledWith('second');
    expect(invalidateQueries).toHaveBeenCalledWith({
      queryKey: sessionStepKeys.list('session-1'),
    });
  });

  it.each([
    ['up', 'second', ['second', 'first', 'third']],
    ['down', 'second', ['first', 'third', 'second']],
    ['down', 'first', ['second', 'first', 'third']],
    ['up', 'third', ['first', 'third', 'second']],
  ] as const)(
    'moves a step %s by swapping the sort order with its neighbour, shown at once and sent to the service: %s',
    async (direction, stepId, expectedOrder) => {
      const { result } = await renderThreeSteps();

      act(() => {
        result.current.reorderSteps(stepId, direction);
      });
      await settle(0);

      expect(idsOf(result.current.steps)).toEqual(expectedOrder);
      expect(swapStepOrder).toHaveBeenCalledWith(
        'session-1',
        stepId,
        direction,
      );
    },
  );

  it('keeps the sort orders of the two swapped steps exchanged and the third as it was', async () => {
    const { result } = await renderThreeSteps();

    act(() => {
      result.current.reorderSteps('second', 'up');
    });
    await settle(0);

    expect(
      Object.fromEntries(
        result.current.steps.map((step) => [step.id, step.sort_order]),
      ),
    ).toEqual({ first: 20, second: 10, third: 30 });
  });

  it.each([
    ['the first step up', 'first', 'up'],
    ['the last step down', 'third', 'down'],
    ['a step that is not in the list, up', 'elsewhere', 'up'],
    ['a step that is not in the list, down', 'elsewhere', 'down'],
  ] as const)(
    'leaves the list as it is when moving %s',
    async (_name, stepId, direction) => {
      const { result } = await renderThreeSteps();

      act(() => {
        result.current.reorderSteps(stepId, direction);
      });
      await settle(0);

      expect(idsOf(result.current.steps)).toEqual(['first', 'second', 'third']);
    },
  );

  it('reloads the session list when the swap fails and does not when it succeeds', async () => {
    const { result, invalidateQueries } = await renderThreeSteps();

    act(() => {
      result.current.reorderSteps('second', 'up');
    });
    await settle(0);
    expect(invalidateQueries).not.toHaveBeenCalled();

    swapStepOrder.mockRejectedValue(new Error('disk'));
    act(() => {
      result.current.reorderSteps('second', 'up');
    });
    await settle(0);

    expect(invalidateQueries).toHaveBeenCalledWith({
      queryKey: sessionStepKeys.list('session-1'),
    });
  });

  it('shows the given order with each step numbered by its position, drops ids that are not cached and saves the order', async () => {
    const { result } = await renderThreeSteps();

    act(() => {
      result.current.bulkReorder(['third', 'unknown', 'first', 'second']);
    });
    await settle(0);

    expect(
      result.current.steps.map((step) => [step.id, step.sort_order]),
    ).toEqual([
      ['third', 0],
      ['first', 2],
      ['second', 3],
    ]);
    expect(bulkReorderSteps).toHaveBeenCalledWith([
      'third',
      'unknown',
      'first',
      'second',
    ]);
  });

  it('reloads the session list when the bulk reorder fails and does not when it succeeds', async () => {
    const { result, invalidateQueries, queryClient } = await renderThreeSteps();
    // The app's client throws a failed mutation into the Error Boundary; this test reads what the hook does before that.
    queryClient.setDefaultOptions({ mutations: { throwOnError: false } });

    act(() => {
      result.current.bulkReorder(['second', 'first', 'third']);
    });
    await settle(0);
    expect(invalidateQueries).not.toHaveBeenCalled();

    bulkReorderSteps.mockRejectedValue(new Error('disk'));
    act(() => {
      result.current.bulkReorder(['first', 'second', 'third']);
    });
    await settle(0);

    expect(invalidateQueries).toHaveBeenCalledWith({
      queryKey: sessionStepKeys.list('session-1'),
    });
  });

  it('changes nothing in the cache before the list has loaded', () => {
    getStepsBySessionId.mockImplementation(
      () => new Promise<SessionStep[]>(() => undefined),
    );
    const { result, queryClient } = renderHookWithQueryClient(
      ({ sessionId }: { sessionId: string }) => useSessionSteps(sessionId),
      { initialProps: { sessionId: 'session-1' } },
    );

    act(() => {
      result.current.updateStep('first', { name: 'x' });
      result.current.reorderSteps('first', 'down');
      result.current.bulkReorder(['first']);
    });

    expect(
      queryClient.getQueryData(sessionStepKeys.list('session-1')),
    ).toBeUndefined();
  });
});
