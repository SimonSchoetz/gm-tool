import { describe, it, expect, beforeEach, vi } from 'vitest';
import type * as sessionStepDb from '@db/session-step';
import { buildSessionStep } from './support/sessionFixtures';

const getAllBySession = vi.hoisted(() =>
  vi.fn<typeof sessionStepDb.getAllBySession>(),
);
const append = vi.hoisted(() => vi.fn<typeof sessionStepDb.append>());
const update = vi.hoisted(() => vi.fn<typeof sessionStepDb.update>());
const remove = vi.hoisted(() => vi.fn<typeof sessionStepDb.remove>());
const updateSortOrders = vi.hoisted(() =>
  vi.fn<typeof sessionStepDb.updateSortOrders>(),
);

vi.mock('@db/session-step', () => ({
  getAllBySession,
  append,
  update,
  remove,
  updateSortOrders,
}));

beforeEach(() => {
  vi.resetModules();
  getAllBySession.mockReset().mockResolvedValue([]);
  append.mockReset().mockResolvedValue('new-step');
  update.mockReset().mockResolvedValue();
  remove.mockReset().mockResolvedValue();
  updateSortOrders.mockReset().mockResolvedValue();
});

describe('getStepsBySessionId', () => {
  it("returns the session's steps", async () => {
    const { getStepsBySessionId } = await import('../sessionStepService');
    const steps = [buildSessionStep({ id: 'a' })];
    getAllBySession.mockResolvedValue(steps);

    await expect(getStepsBySessionId('session-7')).resolves.toEqual(steps);
    expect(getAllBySession).toHaveBeenCalledWith('session-7');
  });

  it('rejects as SessionStepLoadError when the load fails', async () => {
    const { getStepsBySessionId } = await import('../sessionStepService');
    getAllBySession.mockRejectedValue(new Error('disk'));

    await expect(getStepsBySessionId('session-7')).rejects.toMatchObject({
      name: 'SessionStepLoadError',
    });
  });
});

describe('updateStep and deleteStep', () => {
  it('hand the id and the data to the update, and the id to the removal', async () => {
    const { updateStep, deleteStep } = await import('../sessionStepService');

    await updateStep('s1', { content: 'text' });
    await deleteStep('s1');

    expect(update).toHaveBeenCalledWith('s1', { content: 'text' });
    expect(remove).toHaveBeenCalledWith('s1');
  });

  it('reject as SessionStepUpdateError and SessionStepDeleteError when the call fails', async () => {
    const { updateStep, deleteStep } = await import('../sessionStepService');
    update.mockRejectedValue(new Error('disk'));
    remove.mockRejectedValue(new Error('disk'));

    await expect(updateStep('s1', {})).rejects.toMatchObject({
      name: 'SessionStepUpdateError',
    });
    await expect(deleteStep('s1')).rejects.toMatchObject({
      name: 'SessionStepDeleteError',
    });
  });
});

describe('createCustomStep', () => {
  it('appends a step with the given name to the session and returns its id', async () => {
    const { createCustomStep } = await import('../sessionStepService');

    await expect(createCustomStep('session-7', 'Notes')).resolves.toBe(
      'new-step',
    );

    expect(append).toHaveBeenCalledWith({
      session_id: 'session-7',
      name: 'Notes',
    });
  });

  it('leaves the name out of the input when none is given', async () => {
    const { createCustomStep } = await import('../sessionStepService');

    await createCustomStep('session-7');

    expect(append).toHaveBeenCalledWith({ session_id: 'session-7' });
    expect(append.mock.calls[0][0]).not.toHaveProperty('name');
  });

  it('passes an empty name on, as a name the caller gave', async () => {
    const { createCustomStep } = await import('../sessionStepService');

    await createCustomStep('session-7', '');

    expect(append).toHaveBeenCalledWith({
      session_id: 'session-7',
      name: '',
    });
  });

  it('rejects as SessionStepCreateError when the step cannot be appended', async () => {
    const { createCustomStep } = await import('../sessionStepService');
    append.mockRejectedValueOnce(new Error('disk'));

    await expect(createCustomStep('session-7')).rejects.toMatchObject({
      name: 'SessionStepCreateError',
    });
  });
});

describe('swapStepOrder', () => {
  const steps = () => [
    buildSessionStep({ id: 'first', sort_order: 10 }),
    buildSessionStep({ id: 'second', sort_order: 20 }),
    buildSessionStep({ id: 'third', sort_order: 30 }),
  ];

  it('exchanges the sort order of a step and the one above it when moving up', async () => {
    const { swapStepOrder } = await import('../sessionStepService');
    getAllBySession.mockResolvedValue(steps());

    await swapStepOrder('session-7', 'second', 'up');

    expect(updateSortOrders.mock.calls).toEqual([
      [
        [
          { id: 'second', sort_order: 10 },
          { id: 'first', sort_order: 20 },
        ],
      ],
    ]);
  });

  it('exchanges the sort order of a step and the one below it when moving down', async () => {
    const { swapStepOrder } = await import('../sessionStepService');
    getAllBySession.mockResolvedValue(steps());

    await swapStepOrder('session-7', 'second', 'down');

    expect(updateSortOrders.mock.calls).toEqual([
      [
        [
          { id: 'second', sort_order: 30 },
          { id: 'third', sort_order: 20 },
        ],
      ],
    ]);
  });

  it('changes nothing for the first step moving up, the last step moving down, and a step that is not in the session', async () => {
    const { swapStepOrder } = await import('../sessionStepService');
    getAllBySession.mockResolvedValue(steps());

    await swapStepOrder('session-7', 'first', 'up');
    await swapStepOrder('session-7', 'third', 'down');
    await expect(
      swapStepOrder('session-7', 'elsewhere', 'up'),
    ).resolves.toBeUndefined();
    await expect(
      swapStepOrder('session-7', 'elsewhere', 'down'),
    ).resolves.toBeUndefined();

    expect(updateSortOrders).not.toHaveBeenCalled();
  });

  it('can move the first step down and the last step up', async () => {
    const { swapStepOrder } = await import('../sessionStepService');
    getAllBySession.mockResolvedValue(steps());

    await swapStepOrder('session-7', 'first', 'down');
    await swapStepOrder('session-7', 'third', 'up');

    expect(updateSortOrders.mock.calls).toEqual([
      [
        [
          { id: 'first', sort_order: 20 },
          { id: 'second', sort_order: 10 },
        ],
      ],
      [
        [
          { id: 'third', sort_order: 20 },
          { id: 'second', sort_order: 30 },
        ],
      ],
    ]);
  });

  it('rejects as SessionStepReorderError when the steps cannot be read or the write fails', async () => {
    const { swapStepOrder } = await import('../sessionStepService');
    getAllBySession.mockRejectedValueOnce(new Error('disk'));

    await expect(
      swapStepOrder('session-7', 'second', 'up'),
    ).rejects.toMatchObject({ name: 'SessionStepReorderError' });

    getAllBySession.mockResolvedValue(steps());
    updateSortOrders.mockRejectedValueOnce(new Error('disk'));

    await expect(
      swapStepOrder('session-7', 'second', 'up'),
    ).rejects.toMatchObject({ name: 'SessionStepReorderError' });
  });
});

describe('bulkReorderSteps', () => {
  it('gives each step the sort order of its position in the list, in one write', async () => {
    const { bulkReorderSteps } = await import('../sessionStepService');

    await bulkReorderSteps(['c', 'a', 'b']);

    expect(updateSortOrders.mock.calls).toEqual([
      [
        [
          { id: 'c', sort_order: 0 },
          { id: 'a', sort_order: 1 },
          { id: 'b', sort_order: 2 },
        ],
      ],
    ]);
  });

  it('rejects as SessionStepReorderError when the write fails', async () => {
    const { bulkReorderSteps } = await import('../sessionStepService');
    updateSortOrders.mockRejectedValueOnce(new Error('disk'));

    await expect(bulkReorderSteps(['a', 'b'])).rejects.toMatchObject({
      name: 'SessionStepReorderError',
    });
  });
});
