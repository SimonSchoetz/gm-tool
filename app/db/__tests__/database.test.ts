import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import type { Session } from '../database';

// Create mock database instance
const mockExecute = vi.fn();
const mockSelect = vi.fn();
const mockDb = {
  execute: mockExecute,
  select: mockSelect,
};

// Mock the Tauri SQL plugin
vi.mock('@tauri-apps/plugin-sql', () => ({
  default: {
    load: vi.fn().mockResolvedValue(mockDb),
  },
}));

describe('Database Layer', () => {
  // Import after mocking
  let initDatabase: () => Promise<any>;
  let getDatabase: () => Promise<any>;
  let createSession: (session: Session) => Promise<number>;
  let getAllSessions: () => Promise<Session[]>;
  let getSession: (id: number) => Promise<Session | null>;
  let updateSession: (id: number, session: Partial<Session>) => Promise<void>;
  let deleteSession: (id: number) => Promise<void>;

  beforeEach(async () => {
    vi.clearAllMocks();
    mockExecute.mockResolvedValue({ lastInsertId: 0 });
    mockSelect.mockResolvedValue([]);

    // Dynamically import the module to get fresh instance
    const db = await import('../database');
    initDatabase = db.initDatabase;
    getDatabase = db.getDatabase;
    createSession = db.createSession;
    getAllSessions = db.getAllSessions;
    getSession = db.getSession;
    updateSession = db.updateSession;
    deleteSession = db.deleteSession;
  });

  afterEach(() => {
    vi.resetModules();
  });

  describe('initDatabase', () => {
    it('should load database and create sessions table', async () => {
      mockExecute.mockResolvedValue({ lastInsertId: 0 });

      await initDatabase();

      expect(mockExecute).toHaveBeenCalledWith(
        expect.stringContaining('CREATE TABLE IF NOT EXISTS sessions')
      );
    });
  });

  describe('createSession', () => {
    it('should insert session with all fields', async () => {
      const mockSession: Session = {
        title: 'Test Session',
        description: 'Test Description',
        session_date: '2025-10-13',
        notes: 'Test notes',
      };

      mockExecute.mockResolvedValue({ lastInsertId: 1 });

      const sessionId = await createSession(mockSession);

      expect(mockExecute).toHaveBeenCalledWith(
        'INSERT INTO sessions (title, description, session_date, notes) VALUES ($1, $2, $3, $4)',
        ['Test Session', 'Test Description', '2025-10-13', 'Test notes']
      );
      expect(sessionId).toBe(1);
    });

    it('should insert session with only required fields', async () => {
      const mockSession: Session = {
        title: 'Minimal Session',
      };

      mockExecute.mockResolvedValue({ lastInsertId: 2 });

      const sessionId = await createSession(mockSession);

      expect(mockExecute).toHaveBeenCalledWith(
        'INSERT INTO sessions (title, description, session_date, notes) VALUES ($1, $2, $3, $4)',
        ['Minimal Session', null, null, null]
      );
      expect(sessionId).toBe(2);
    });
  });

  describe('getAllSessions', () => {
    it('should return all sessions ordered by created_at DESC', async () => {
      const mockSessions: Session[] = [
        { id: 2, title: 'Newer Session', created_at: '2025-10-13' },
        { id: 1, title: 'Older Session', created_at: '2025-10-12' },
      ];

      mockSelect.mockResolvedValue(mockSessions);

      const sessions = await getAllSessions();

      expect(mockSelect).toHaveBeenCalledWith(
        'SELECT * FROM sessions ORDER BY created_at DESC'
      );
      expect(sessions).toEqual(mockSessions);
    });

    it('should return empty array when no sessions exist', async () => {
      mockSelect.mockResolvedValue([]);

      const sessions = await getAllSessions();

      expect(sessions).toEqual([]);
    });
  });

  describe('getSession', () => {
    it('should return session by id', async () => {
      const mockSession: Session = {
        id: 1,
        title: 'Test Session',
        description: 'Test Description',
      };

      mockSelect.mockResolvedValue([mockSession]);

      const session = await getSession(1);

      expect(mockSelect).toHaveBeenCalledWith(
        'SELECT * FROM sessions WHERE id = $1',
        [1]
      );
      expect(session).toEqual(mockSession);
    });

    it('should return null when session not found', async () => {
      mockSelect.mockResolvedValue([]);

      const session = await getSession(999);

      expect(session).toBeNull();
    });
  });

  describe('updateSession', () => {
    it('should update all provided fields', async () => {
      const updates: Partial<Session> = {
        title: 'Updated Title',
        description: 'Updated Description',
        session_date: '2025-10-14',
        notes: 'Updated notes',
      };

      mockExecute.mockResolvedValue({});

      await updateSession(1, updates);

      expect(mockExecute).toHaveBeenCalledWith(
        'UPDATE sessions SET title = $1, description = $2, session_date = $3, notes = $4, updated_at = CURRENT_TIMESTAMP WHERE id = $5',
        ['Updated Title', 'Updated Description', '2025-10-14', 'Updated notes', 1]
      );
    });

    it('should update only provided fields', async () => {
      const updates: Partial<Session> = {
        title: 'Updated Title Only',
      };

      mockExecute.mockResolvedValue({});

      await updateSession(1, updates);

      expect(mockExecute).toHaveBeenCalledWith(
        'UPDATE sessions SET title = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2',
        ['Updated Title Only', 1]
      );
    });
  });

  describe('deleteSession', () => {
    it('should delete session by id', async () => {
      mockExecute.mockResolvedValue({});

      await deleteSession(1);

      expect(mockExecute).toHaveBeenCalledWith(
        'DELETE FROM sessions WHERE id = $1',
        [1]
      );
    });
  });
});
