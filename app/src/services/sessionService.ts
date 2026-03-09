import * as sessionDb from '@db/session';
import type { Session, CreateSessionInput, UpdateSessionInput } from '@db/session';
import * as sessionStepService from './sessionStepService';
import {
  SessionNotFoundError,
  SessionLoadError,
  SessionCreateError,
  SessionUpdateError,
  SessionDeleteError,
} from '@/domain/sessions';

export const getAllSessions = async (adventureId: string): Promise<Session[]> => {
  try {
    return await sessionDb.getAll(adventureId);
  } catch (err) {
    throw new SessionLoadError(err);
  }
};

export const getSessionById = async (id: string): Promise<Session> => {
  try {
    const session = await sessionDb.get(id);
    if (!session) throw new SessionNotFoundError(id);
    return session;
  } catch (err) {
    if (err instanceof SessionNotFoundError) throw err;
    throw new SessionLoadError(err);
  }
};

export const createSession = async (data: CreateSessionInput): Promise<string> => {
  try {
    const newSessionId = await sessionDb.create(data);
    await sessionStepService.initDefaultSteps(newSessionId);
    return newSessionId;
  } catch (err) {
    throw new SessionCreateError(err);
  }
};

export const updateSession = async (id: string, data: UpdateSessionInput): Promise<void> => {
  try {
    await sessionDb.update(id, data);
  } catch (err) {
    throw new SessionUpdateError(id, err);
  }
};

export const deleteSession = async (id: string): Promise<void> => {
  try {
    await sessionDb.remove(id);
  } catch (err) {
    throw new SessionDeleteError(id, err);
  }
};
