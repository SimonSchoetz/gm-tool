import * as sessionDb from '@db/session';
import type { Session, CreateSessionInput, UpdateSessionInput } from '@db/session';
import * as sessionStepService from './sessionStepService';

export const getAllSessions = async (adventureId: string): Promise<Session[]> =>
  sessionDb.getAll(adventureId);

export const getSessionById = async (id: string): Promise<Session> => {
  const session = await sessionDb.get(id);
  if (!session) throw new Error(`Session not found: ${id}`);
  return session;
};

export const createSession = async (data: CreateSessionInput): Promise<string> => {
  const newSessionId = await sessionDb.create(data);
  await sessionStepService.initDefaultSteps(newSessionId);
  return newSessionId;
};

export const updateSession = async (id: string, data: UpdateSessionInput): Promise<void> => {
  await sessionDb.update(id, data);
};

export const deleteSession = async (id: string): Promise<void> => {
  await sessionDb.remove(id);
};
