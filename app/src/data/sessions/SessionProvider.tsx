import { createContext, useEffect, useState, ReactNode } from 'react';
import { initDatabase } from '@db/database';
import type {
  Session,
  CreateSessionInput,
  UpdateSessionInput,
} from '@db/session';
import * as session from '@db/session';

type SessionContextType = {
  sessions: Session[];
  loading: boolean;
  error: string | null;
  createSession: (data: CreateSessionInput) => Promise<void>;
  updateSession: (id: string, data: UpdateSessionInput) => Promise<void>;
  deleteSession: (id: string) => Promise<void>;
  refreshSessions: () => Promise<void>;
};

export const SessionContext = createContext<SessionContextType | null>(null);

type SessionProviderProps = {
  children: ReactNode;
};

export const SessionProvider = ({ children }: SessionProviderProps) => {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadSessions = async () => {
    try {
      setLoading(true);
      const result = await session.getAll();
      setSessions(result.data);
      setError(null);
    } catch (err) {
      console.error('Failed to load sessions:', err);
      setError(`Failed to load sessions: ${err}`);
    } finally {
      setLoading(false);
    }
  };

  const createSession = async (data: CreateSessionInput) => {
    try {
      await session.create(data);
      await loadSessions();
    } catch (err) {
      console.error('Failed to create session:', err);
      throw err;
    }
  };

  const updateSession = async (id: string, data: UpdateSessionInput) => {
    try {
      await session.update(id, data);
      await loadSessions();
    } catch (err) {
      console.error('Failed to update session:', err);
      throw err;
    }
  };

  const deleteSession = async (id: string) => {
    try {
      await session.remove(id);
      await loadSessions();
    } catch (err) {
      console.error('Failed to delete session:', err);
      throw err;
    }
  };

  const refreshSessions = async () => {
    await loadSessions();
  };

  useEffect(() => {
    const init = async () => {
      try {
        await initDatabase();
        await loadSessions();
      } catch (err) {
        console.error('Failed to initialize database:', err);
        setError(`Database error: ${err}`);
        setLoading(false);
      }
    };
    init();
  }, []);

  const value: SessionContextType = {
    sessions,
    loading,
    error,
    createSession,
    updateSession,
    deleteSession,
    refreshSessions,
  };

  return (
    <SessionContext.Provider value={value}>{children}</SessionContext.Provider>
  );
};
