import * as sessionDb from '@db/session';
import type { Session, CreateSessionInput, UpdateSessionInput } from '@db/session';
import * as sessionStepService from './sessionStepService';
import {
  sessionNotFoundError,
  sessionLoadError,
  sessionCreateError,
  sessionUpdateError,
  sessionDeleteError,
} from '@/domain/sessions';

export const getAllSessions = async (adventureId: string): Promise<Session[]> => {
  try {
    return await sessionDb.getAll(adventureId);
  } catch (err) {
    throw sessionLoadError(err);
  }
};

export const getSessionById = async (id: string): Promise<Session> => {
  let session: Session | null | undefined;
  try {
    session = await sessionDb.get(id);
  } catch (err) {
    throw sessionLoadError(err);
  }
  if (!session) throw sessionNotFoundError(id);
  return session;
};

export const createSession = async (data: CreateSessionInput): Promise<string> => {
  try {
    const newSessionId = await sessionDb.create({
      name: 'New Session',
      ...data,
    });
    await sessionStepService.initDefaultSteps(newSessionId);
    return newSessionId;
  } catch (err) {
    throw sessionCreateError(err);
  }
};

export const updateSession = async (id: string, data: UpdateSessionInput): Promise<void> => {
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
