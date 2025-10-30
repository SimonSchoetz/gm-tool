import { useState, useEffect } from 'react';
import { initDatabase } from '@db/database';
import * as session from '@db/session';
import type { Session } from '@db/session';
import { SessionForm, SessionList } from '@/features/sessions';

function App() {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    session_date: '',
    notes: '',
  });

  useEffect(() => {
    initDB();
  }, []);

  async function initDB() {
    try {
      console.log('App: Starting DB initialization');
      await initDatabase();
      console.log('App: DB initialized, loading sessions');
      await loadSessions();
    } catch (error) {
      console.error('Failed to initialize database:', error);
      setError(`Database error: ${error}`);
      setLoading(false);
    }
  }

  async function loadSessions() {
    try {
      setLoading(true);
      const result = await session.getAll();
      setSessions(result.data);
    } catch (error) {
      console.error('Failed to load sessions:', error);
    } finally {
      setLoading(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    try {
      if (editingId) {
        await session.update(editingId, formData);
        setEditingId(null);
      } else {
        await session.create(formData);
      }
      setFormData({ title: '', description: '', session_date: '', notes: '' });
      await loadSessions();
    } catch (error) {
      console.error('Failed to save session:', error);
    }
  }

  async function handleDelete(id: string) {
    if (confirm('Are you sure you want to delete this session?')) {
      try {
        await session.remove(id);
        await loadSessions();
      } catch (error) {
        console.error('Failed to delete session:', error);
      }
    }
  }

  function handleEdit(sessionData: Session) {
    setEditingId(sessionData.id!);
    setFormData({
      title: sessionData.title,
      description: sessionData.description || '',
      session_date: sessionData.session_date || '',
      notes: sessionData.notes || '',
    });
  }

  function handleCancel() {
    setEditingId(null);
    setFormData({ title: '', description: '', session_date: '', notes: '' });
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

      <SessionForm
        formData={formData}
        isEditing={editingId !== null}
        onSubmit={handleSubmit}
        onChange={setFormData}
        onCancel={handleCancel}
      />

      <SessionList
        sessions={sessions}
        onEdit={handleEdit}
        onDelete={handleDelete}
      />
    </main>
  );
}

export default App;
