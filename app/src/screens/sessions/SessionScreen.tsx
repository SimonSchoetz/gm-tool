import { useState } from 'react';
import type { Session } from '@db/session';
import { useSessions } from '@/data/sessions';
import { SessionForm, SessionList } from './components';

export const SessionScreen = () => {
  const {
    sessions,
    loading,
    error,
    createSession,
    updateSession,
    deleteSession,
  } = useSessions();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    session_date: '',
    notes: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingId) {
        await updateSession(editingId, formData);
        setEditingId(null);
      } else {
        await createSession(formData);
      }
      setFormData({ title: '', description: '', session_date: '', notes: '' });
    } catch (error) {
      console.error('Failed to save session:', error);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteSession(id);
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

  if (loading) {
    return <div>Loading...</div>;
  }

  if (error) {
    return (
      <div>
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
