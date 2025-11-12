import { useEffect, useState } from 'react';
import { ActionCard } from '@/components';
import { initDatabase } from '@db/database';
import type { Adventure } from '@db/adventure';
import * as adventure from '@db/adventure';
import AdventureForm from './components/AdventureForm';
import './AdventureScreen.css';

const AdventureScreen = () => {
  const [adventures, setAdventures] = useState<Adventure[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
  });

  useEffect(() => {
    initDB();
  }, []);

  async function initDB() {
    try {
      await initDatabase();
      await loadAdventures();
    } catch (error) {
      console.error('Failed to initialize database:', error);
      setError(`Database error: ${error}`);
      setLoading(false);
    }
  }

  async function loadAdventures() {
    try {
      setLoading(true);
      const result = await adventure.getAll();
      setAdventures(result.data);
    } catch (error) {
      console.error('Failed to load adventures:', error);
    } finally {
      setLoading(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    try {
      await adventure.create(formData);
      setFormData({ title: '', description: '' });
      setShowForm(false);
      await loadAdventures();
    } catch (error) {
      console.error('Failed to save adventure:', error);
    }
  }

  function handleCancel() {
    setShowForm(false);
    setFormData({ title: '', description: '' });
  }

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
    <div className='adventure-screen'>
      {adventures.length === 0 && !showForm && (
        <ActionCard className='empty-state' onClick={() => setShowForm(true)}>
          <div className='plus-symbol'>+</div>
          <p>Create Adventure</p>
        </ActionCard>
      )}

      {showForm && (
        <AdventureForm
          formData={formData}
          onSubmit={handleSubmit}
          onChange={setFormData}
          onCancel={handleCancel}
        />
      )}
    </div>
  );
};

export default AdventureScreen;
