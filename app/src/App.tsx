import { useState, useEffect } from "react";
import { initDatabase, getAllSessions, createSession, updateSession, deleteSession, Session } from "./db/database";
import "./App.css";

function App() {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    session_date: "",
    notes: "",
  });

  useEffect(() => {
    initDB();
  }, []);

  async function initDB() {
    try {
      console.log("App: Starting DB initialization");
      await initDatabase();
      console.log("App: DB initialized, loading sessions");
      await loadSessions();
    } catch (error) {
      console.error("Failed to initialize database:", error);
      setError(`Database error: ${error}`);
      setLoading(false);
    }
  }

  async function loadSessions() {
    try {
      setLoading(true);
      const data = await getAllSessions();
      setSessions(data);
    } catch (error) {
      console.error("Failed to load sessions:", error);
    } finally {
      setLoading(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    try {
      if (editingId) {
        await updateSession(editingId, formData);
        setEditingId(null);
      } else {
        await createSession(formData);
      }
      setFormData({ title: "", description: "", session_date: "", notes: "" });
      await loadSessions();
    } catch (error) {
      console.error("Failed to save session:", error);
    }
  }

  async function handleDelete(id: number) {
    if (confirm("Are you sure you want to delete this session?")) {
      try {
        await deleteSession(id);
        await loadSessions();
      } catch (error) {
        console.error("Failed to delete session:", error);
      }
    }
  }

  function handleEdit(session: Session) {
    setEditingId(session.id!);
    setFormData({
      title: session.title,
      description: session.description || "",
      session_date: session.session_date || "",
      notes: session.notes || "",
    });
  }

  function handleCancel() {
    setEditingId(null);
    setFormData({ title: "", description: "", session_date: "", notes: "" });
  }

  if (loading) {
    return <div className="container">Loading...</div>;
  }

  if (error) {
    return (
      <div className="container">
        <h1>Error</h1>
        <p style={{ color: 'red' }}>{error}</p>
        <p>Check the browser console for more details</p>
      </div>
    );
  }

  return (
    <main className="container">
      <h1>GM Tool - Session Manager</h1>

      <form onSubmit={handleSubmit} className="session-form">
        <input
          type="text"
          placeholder="Session Title *"
          value={formData.title}
          onChange={(e) => setFormData({ ...formData, title: e.target.value })}
          required
        />
        <input
          type="text"
          placeholder="Description"
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
        />
        <input
          type="date"
          value={formData.session_date}
          onChange={(e) => setFormData({ ...formData, session_date: e.target.value })}
        />
        <textarea
          placeholder="Session Notes"
          value={formData.notes}
          onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
          rows={4}
        />
        <div className="form-buttons">
          <button type="submit">{editingId ? "Update" : "Create"} Session</button>
          {editingId && (
            <button type="button" onClick={handleCancel}>
              Cancel
            </button>
          )}
        </div>
      </form>

      <div className="sessions-list">
        <h2>Sessions ({sessions.length})</h2>
        {sessions.length === 0 ? (
          <p>No sessions yet. Create your first session above!</p>
        ) : (
          sessions.map((session) => (
            <div key={session.id} className="session-card">
              <h3>{session.title}</h3>
              {session.description && <p className="description">{session.description}</p>}
              {session.session_date && (
                <p className="date">Date: {new Date(session.session_date).toLocaleDateString()}</p>
              )}
              {session.notes && (
                <div className="notes">
                  <strong>Notes:</strong>
                  <p>{session.notes}</p>
                </div>
              )}
              <div className="session-actions">
                <button onClick={() => handleEdit(session)}>Edit</button>
                <button onClick={() => handleDelete(session.id!)}>Delete</button>
              </div>
            </div>
          ))
        )}
      </div>
    </main>
  );
}

export default App;
