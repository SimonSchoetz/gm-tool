import { describe, it, expect, beforeEach, vi } from 'vitest';
import type * as sessionDb from '@db/session';
import type * as sessionStepDb from '@db/session-step';
import { LAZY_DM_STEPS } from '@domain';
import { buildSession } from './support/sessionFixtures';

const getAll = vi.hoisted(() => vi.fn<typeof sessionDb.getAll>());
const get = vi.hoisted(() => vi.fn<typeof sessionDb.get>());
const create = vi.hoisted(() => vi.fn<typeof sessionDb.create>());
const duplicate = vi.hoisted(() => vi.fn<typeof sessionDb.duplicate>());
const update = vi.hoisted(() => vi.fn<typeof sessionDb.update>());
const remove = vi.hoisted(() => vi.fn<typeof sessionDb.remove>());
const createStep = vi.hoisted(() => vi.fn<typeof sessionStepDb.create>());
const duplicateBySession = vi.hoisted(() =>
  vi.fn<typeof sessionStepDb.duplicateBySession>(),
);

vi.mock('@db/session', () => ({
  getAll,
  get,
  create,
  duplicate,
  update,
  remove,
}));
vi.mock('@db/session-step', () => ({
  create: createStep,
  duplicateBySession,
}));

beforeEach(() => {
  vi.resetModules();
  getAll.mockReset().mockResolvedValue([]);
  get.mockReset().mockResolvedValue(null);
  create.mockReset().mockResolvedValue('new-session');
  duplicate.mockReset().mockResolvedValue('copy-session');
  update.mockReset().mockResolvedValue();
  remove.mockReset().mockResolvedValue();
  createStep.mockReset().mockResolvedValue('step');
  duplicateBySession.mockReset().mockResolvedValue();
});

describe('getAllSessions', () => {
  it('returns the sessions of the adventure', async () => {
    const { getAllSessions } = await import('../sessionService');
    const sessions = [buildSession({ id: 'a' }), buildSession({ id: 'b' })];
    getAll.mockResolvedValue(sessions);

    await expect(getAllSessions('adventure-7')).resolves.toEqual(sessions);
    expect(getAll).toHaveBeenCalledWith('adventure-7');
  });

  it('rejects as SessionLoadError when the load fails', async () => {
    const { getAllSessions } = await import('../sessionService');
    getAll.mockRejectedValue(new Error('disk'));

    await expect(getAllSessions('adventure-7')).rejects.toMatchObject({
      name: 'SessionLoadError',
    });
  });
});

describe('getSessionById', () => {
  it('returns the session', async () => {
    const { getSessionById } = await import('../sessionService');
    const session = buildSession({ id: 'found' });
    get.mockResolvedValue(session);

    await expect(getSessionById('found')).resolves.toEqual(session);
    expect(get).toHaveBeenCalledWith('found');
  });

  it('rejects as SessionNotFoundError naming the id when there is no such session', async () => {
    const { getSessionById } = await import('../sessionService');

    await expect(getSessionById('missing')).rejects.toMatchObject({
      name: 'SessionNotFoundError',
      message: 'Session with id missing not found',
    });
  });

  it('rejects as SessionLoadError, not as not found, when the load fails', async () => {
    const { getSessionById } = await import('../sessionService');
    get.mockRejectedValue(new Error('disk'));

    await expect(getSessionById('any')).rejects.toMatchObject({
      name: 'SessionLoadError',
    });
  });
});

describe('createSession', () => {
  it('creates the session and one step per lazy DM step, in order, each keyed to its step', async () => {
    const { createSession } = await import('../sessionService');

    await expect(createSession('adventure-7')).resolves.toBe('new-session');

    expect(create).toHaveBeenCalledWith('adventure-7');
    expect(createStep.mock.calls.map(([input]) => input)).toEqual(
      LAZY_DM_STEPS.map((step, index) => ({
        session_id: 'new-session',
        sort_order: index,
        default_step_key: step.key,
      })),
    );
  });

  it('creates no step before the session exists, and one at a time', async () => {
    const { createSession } = await import('../sessionService');

    await createSession('adventure-7');

    expect(create.mock.invocationCallOrder[0]).toBeLessThan(
      Math.min(...createStep.mock.invocationCallOrder),
    );
  });

  it('rejects as SessionCreateError and creates no step when the session cannot be created', async () => {
    const { createSession } = await import('../sessionService');
    create.mockRejectedValue(new Error('disk'));

    await expect(createSession('adventure-7')).rejects.toMatchObject({
      name: 'SessionCreateError',
    });
    expect(createStep).not.toHaveBeenCalled();
  });

  it('rejects as SessionCreateError and creates no further step when a step fails', async () => {
    const { createSession } = await import('../sessionService');
    createStep.mockRejectedValueOnce(new Error('disk'));

    await expect(createSession('adventure-7')).rejects.toMatchObject({
      name: 'SessionCreateError',
    });
    expect(createStep).toHaveBeenCalledTimes(1);
  });
});

describe('duplicateSession', () => {
  it('duplicates the session, then copies its steps onto the copy, and seeds no default steps', async () => {
    const { duplicateSession } = await import('../sessionService');

    await expect(duplicateSession('original')).resolves.toBe('copy-session');

    expect(duplicate).toHaveBeenCalledWith('original');
    expect(duplicateBySession).toHaveBeenCalledWith('original', 'copy-session');
    expect(duplicate.mock.invocationCallOrder[0]).toBeLessThan(
      duplicateBySession.mock.invocationCallOrder[0],
    );
    expect(create).not.toHaveBeenCalled();
    expect(createStep).not.toHaveBeenCalled();
  });

  it('rejects as SessionDuplicateError when the session cannot be duplicated, and copies no step', async () => {
    const { duplicateSession } = await import('../sessionService');
    duplicate.mockRejectedValue(new Error('disk'));

    await expect(duplicateSession('original')).rejects.toMatchObject({
      name: 'SessionDuplicateError',
    });
    expect(duplicateBySession).not.toHaveBeenCalled();
  });

  it('rejects as SessionDuplicateError when the steps cannot be copied', async () => {
    const { duplicateSession } = await import('../sessionService');
    duplicateBySession.mockRejectedValue(new Error('disk'));

    await expect(duplicateSession('original')).rejects.toMatchObject({
      name: 'SessionDuplicateError',
    });
  });
});

describe('updateSession', () => {
  it('hands the id and the data to the update', async () => {
    const { updateSession } = await import('../sessionService');

    await updateSession('s1', { name: 'Renamed' });

    expect(update).toHaveBeenCalledWith('s1', { name: 'Renamed' });
  });

  it('rejects as SessionUpdateError when the update fails', async () => {
    const { updateSession } = await import('../sessionService');
    update.mockRejectedValue(new Error('disk'));

    await expect(updateSession('s1', {})).rejects.toMatchObject({
      name: 'SessionUpdateError',
    });
  });
});

describe('deleteSession', () => {
  it('removes the session by id', async () => {
    const { deleteSession } = await import('../sessionService');

    await deleteSession('s1');

    expect(remove).toHaveBeenCalledWith('s1');
  });

  it('rejects as SessionDeleteError when the removal fails', async () => {
    const { deleteSession } = await import('../sessionService');
    remove.mockRejectedValue(new Error('disk'));

    await expect(deleteSession('s1')).rejects.toMatchObject({
      name: 'SessionDeleteError',
    });
  });
});
