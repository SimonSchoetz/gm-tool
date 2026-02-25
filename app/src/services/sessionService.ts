import * as sessionDb from '@db/session';
import type { Session, CreateSessionInput, UpdateSessionInput } from '@db/session';

export const getAllSessions = async (): Promise<Session[]> => {
  const result = await sessionDb.getAll();
  return result.data;
};

export const getSessionById = async (id: string): Promise<Session> => {
  const session = await sessionDb.get(id);
  if (!session) throw new Error(`Session not found: ${id}`);
  return session;
};

export const createSession = async (data: CreateSessionInput): Promise<string> =>
  sessionDb.create(data);

export const updateSession = async (id: string, data: UpdateSessionInput): Promise<void> => {
  await sessionDb.update(id, data);
};

export const deleteSession = async (id: string): Promise<void> => {
  await sessionDb.remove(id);
};
