import Database from "@tauri-apps/plugin-sql";

let db: Database | null = null;

export async function initDatabase() {
  if (db) return db;

  try {
    console.log("Attempting to load database...");
    // Create/connect to SQLite database in app data directory
    db = await Database.load("sqlite:gm_tool.db");
    console.log("Database loaded successfully");

    // Create sessions table
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
    console.log("Sessions table created/verified");

    return db;
  } catch (error) {
    console.error("Database initialization failed:", error);
    throw error;
  }
}

export async function getDatabase() {
  if (!db) {
    await initDatabase();
  }
  return db!;
}

// Session types
export interface Session {
  id?: number;
  title: string;
  description?: string;
  session_date?: string;
  notes?: string;
  created_at?: string;
  updated_at?: string;
}

// CRUD operations
export async function createSession(session: Session): Promise<number> {
  const db = await getDatabase();
  const result = await db.execute(
    "INSERT INTO sessions (title, description, session_date, notes) VALUES ($1, $2, $3, $4)",
    [session.title, session.description || null, session.session_date || null, session.notes || null]
  );
  return result.lastInsertId;
}

export async function getAllSessions(): Promise<Session[]> {
  const db = await getDatabase();
  return await db.select<Session[]>("SELECT * FROM sessions ORDER BY created_at DESC");
}

export async function getSession(id: number): Promise<Session | null> {
  const db = await getDatabase();
  const sessions = await db.select<Session[]>("SELECT * FROM sessions WHERE id = $1", [id]);
  return sessions[0] || null;
}

export async function updateSession(id: number, session: Partial<Session>): Promise<void> {
  const db = await getDatabase();
  const fields: string[] = [];
  const values: any[] = [];
  let paramIndex = 1;

  if (session.title !== undefined) {
    fields.push(`title = $${paramIndex++}`);
    values.push(session.title);
  }
  if (session.description !== undefined) {
    fields.push(`description = $${paramIndex++}`);
    values.push(session.description);
  }
  if (session.session_date !== undefined) {
    fields.push(`session_date = $${paramIndex++}`);
    values.push(session.session_date);
  }
  if (session.notes !== undefined) {
    fields.push(`notes = $${paramIndex++}`);
    values.push(session.notes);
  }

  fields.push(`updated_at = CURRENT_TIMESTAMP`);
  values.push(id);

  await db.execute(
    `UPDATE sessions SET ${fields.join(", ")} WHERE id = $${paramIndex}`,
    values
  );
}

export async function deleteSession(id: number): Promise<void> {
  const db = await getDatabase();
  await db.execute("DELETE FROM sessions WHERE id = $1", [id]);
}
