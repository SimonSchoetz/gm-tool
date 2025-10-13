import Database from '@tauri-apps/plugin-sql';

let db: Database | null = null;

export const initDatabase = async () => {
  if (db) return db;

  try {
    console.log('Attempting to load database...');
    db = await Database.load('sqlite:gm_tool.db');
    console.log('Database loaded successfully');

    await db.execute(`
      CREATE TABLE IF NOT EXISTS sessions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        title TEXT NOT NULL,
        description TEXT,
        session_date TEXT,
        notes TEXT,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP,
        updated_at TEXT DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('Sessions table created/verified');

    return db;
  } catch (error) {
    console.error('Database initialization failed:', error);
    throw error;
  }
};

export const getDatabase = async () => {
  if (!db) {
    await initDatabase();
  }
  return db!;
};
