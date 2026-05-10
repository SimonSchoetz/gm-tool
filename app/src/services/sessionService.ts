import * as sessionDb from '@db/session';
import type { Session, UpdateSessionInput } from '@db/session';
import * as sessionStepDb from '@db/session-step';
import {
  LAZY_DM_STEPS,
  sessionNotFoundError,
  sessionLoadError,
  sessionCreateError,
  sessionUpdateError,
  sessionDeleteError,
} from '@/domain';

export const getAllSessions = async (
  adventureId: string,
): Promise<Session[]> => {
  try {
    return await sessionDb.getAll(adventureId);
  } catch (err) {
    throw sessionLoadError(err);
  }
};

export const getSessionById = async (id: string): Promise<Session> => {
  let session: Session | null = null;
  try {
    session = await sessionDb.get(id);
  } catch (err) {
    throw sessionLoadError(err);
  }
  if (!session) throw sessionNotFoundError(id);
  return session;
};

export const createSession = async (adventureId: string): Promise<string> => {
  try {
    const newSessionId = await sessionDb.create(adventureId);
    for (let index = 0; index < LAZY_DM_STEPS.length; index++) {
      await sessionStepDb.create({
        session_id: newSessionId,
        sort_order: index,
        default_step_key: LAZY_DM_STEPS[index].key,
      });
    }
    return newSessionId;
  } catch (err) {
    throw sessionCreateError(err);
  }
};

export const updateSession = async (
  id: string,
  data: UpdateSessionInput,
): Promise<void> => {
  try {
    await sessionDb.update(id, data);
  } catch (err) {
    throw sessionUpdateError(id, err);
  }
};

export const deleteSession = async (id: string): Promise<void> => {
  try {
    await sessionDb.remove(id);
  } catch (err) {
    throw sessionDeleteError(id, err);
  }
};
