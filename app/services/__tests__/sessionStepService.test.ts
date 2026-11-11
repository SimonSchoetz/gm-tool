import { describe, it, expect, beforeEach, vi } from 'vitest';
import type * as sessionStepDb from '@db/session-step';
import { buildSessionStep } from './support/sessionFixtures';

const getAllBySession = vi.hoisted(() =>
  vi.fn<typeof sessionStepDb.getAllBySession>(),
);
const create = vi.hoisted(() => vi.fn<typeof sessionStepDb.create>());
const update = vi.hoisted(() => vi.fn<typeof sessionStepDb.update>());
const remove = vi.hoisted(() => vi.fn<typeof sessionStepDb.remove>());

vi.mock('@db/session-step', () => ({
  getAllBySession,
  create,
  update,
  remove,
}));

beforeEach(() => {
  vi.resetModules();
  getAllBySession.mockReset().mockResolvedValue([]);
  create.mockReset().mockResolvedValue('new-step');
  update.mockReset().mockResolvedValue();
  remove.mockReset().mockResolvedValue();
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
  it('sorts the new step after the highest sort order of the session, whatever the order of the list', async () => {
    const { createCustomStep } = await import('../sessionStepService');
    getAllBySession.mockResolvedValue([
      buildSessionStep({ id: 'a', sort_order: 4 }),
      buildSessionStep({ id: 'b', sort_order: 9 }),
      buildSessionStep({ id: 'c', sort_order: 2 }),
    ]);

    await expect(createCustomStep('session-7', 'Notes')).resolves.toBe(
      'new-step',
    );

    expect(getAllBySession).toHaveBeenCalledWith('session-7');
    expect(create).toHaveBeenCalledWith({
      session_id: 'session-7',
      sort_order: 10,
      name: 'Notes',
    });
  });

  it('sorts the first step of a session first, and leaves the name out of the input when none is given', async () => {
    const { createCustomStep } = await import('../sessionStepService');

    await createCustomStep('session-7');

    expect(create).toHaveBeenCalledWith({
      session_id: 'session-7',
      sort_order: 0,
    });
    expect(create.mock.calls[0][0]).not.toHaveProperty('name');
  });

  it('passes an empty name on, as a name the caller gave', async () => {
    const { createCustomStep } = await import('../sessionStepService');

    await createCustomStep('session-7', '');

    expect(create).toHaveBeenCalledWith({
      session_id: 'session-7',
      sort_order: 0,
      name: '',
    });
  });

  it('rejects as SessionStepCreateError when the steps cannot be read or the step cannot be created', async () => {
    const { createCustomStep } = await import('../sessionStepService');
    getAllBySession.mockRejectedValueOnce(new Error('disk'));

    await expect(createCustomStep('session-7')).rejects.toMatchObject({
      name: 'SessionStepCreateError',
    });
    expect(create).not.toHaveBeenCalled();

    create.mockRejectedValueOnce(new Error('disk'));

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

    expect(update.mock.calls).toEqual([
      ['second', { sort_order: 10 }],
      ['first', { sort_order: 20 }],
    ]);
  });

  it('exchanges the sort order of a step and the one below it when moving down', async () => {
    const { swapStepOrder } = await import('../sessionStepService');
    getAllBySession.mockResolvedValue(steps());

    await swapStepOrder('session-7', 'second', 'down');

    expect(update.mock.calls).toEqual([
      ['second', { sort_order: 30 }],
      ['third', { sort_order: 20 }],
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

    expect(update).not.toHaveBeenCalled();
  });

  it('can move the first step down and the last step up', async () => {
    const { swapStepOrder } = await import('../sessionStepService');
    getAllBySession.mockResolvedValue(steps());

    await swapStepOrder('session-7', 'first', 'down');
    await swapStepOrder('session-7', 'third', 'up');

    expect(update.mock.calls).toEqual([
      ['first', { sort_order: 20 }],
      ['second', { sort_order: 10 }],
      ['third', { sort_order: 20 }],
      ['second', { sort_order: 30 }],
    ]);
  });

  it('rejects as SessionStepReorderError when the steps cannot be read or an update fails', async () => {
    const { swapStepOrder } = await import('../sessionStepService');
    getAllBySession.mockRejectedValueOnce(new Error('disk'));

    await expect(
      swapStepOrder('session-7', 'second', 'up'),
    ).rejects.toMatchObject({ name: 'SessionStepReorderError' });

    getAllBySession.mockResolvedValue(steps());
    update.mockRejectedValueOnce(new Error('disk'));

    await expect(
      swapStepOrder('session-7', 'second', 'up'),
    ).rejects.toMatchObject({ name: 'SessionStepReorderError' });
  });
});

describe('bulkReorderSteps', () => {
  it('gives each step the sort order of its position in the list, in order', async () => {
    const { bulkReorderSteps } = await import('../sessionStepService');

    await bulkReorderSteps(['c', 'a', 'b']);

    expect(update.mock.calls).toEqual([
      ['c', { sort_order: 0 }],
      ['a', { sort_order: 1 }],
      ['b', { sort_order: 2 }],
    ]);
  });

  it('updates nothing for an empty list, and rejects as SessionStepReorderError, updating no later step, when an update fails', async () => {
    const { bulkReorderSteps } = await import('../sessionStepService');

    await bulkReorderSteps([]);

    expect(update).not.toHaveBeenCalled();

    update.mockRejectedValueOnce(new Error('disk'));

    await expect(bulkReorderSteps(['a', 'b'])).rejects.toMatchObject({
      name: 'SessionStepReorderError',
    });
    expect(update).toHaveBeenCalledTimes(1);
  });
});
