import { useEffect, useState } from 'react';

import { initDatabase } from '@db/database';
import type { Session } from '@db/session';
import * as session from '@db/session';
import { SessionForm, SessionList } from './components';

const SessionScreen = () => {
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

  const initDB = async () => {
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
  };

  const loadSessions = async () => {
    try {
      setLoading(true);
      const result = await session.getAll();
      setSessions(result.data);
    } catch (error) {
      console.error('Failed to load sessions:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
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
  };

  const handleDelete = async (id: string) => {
    try {
      await session.remove(id);
      await loadSessions();
    } catch (error) {
      console.error('Failed to delete session:', error);
    }
  };

  const handleEdit = (sessionData: Session) => {
    setEditingId(sessionData.id);
    setFormData({
      title: sessionData.title,
      description: sessionData.description || '',
      session_date: sessionData.session_date || '',
      notes: sessionData.notes || '',
    });
  };

  const handleCancel = () => {
    setEditingId(null);
    setFormData({ title: '', description: '', session_date: '', notes: '' });
  };

  useEffect(() => {
    initDB();
  }, []);

  if (loading) {
    return <div className='container'>Loading...</div>;
  }

  if (error) {
    return (
      <div className='container'>
        <h1>Error</h1>
        <p style={{ color: 'red' }}>{error}</p>
        <p>Check the browser console for more details</p>
      </div>
    );
  }

  return (
    <div>
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
    </div>
  );
};

export default SessionScreen;
