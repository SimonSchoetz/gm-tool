import { useState } from 'react';
import { useAdventures } from '@/data/adventures';
import { NewAdventureBtn, AdventureForm } from './components';
import './AdventureScreen.css';

const AdventureScreen = () => {
  const { adventures, loading, error } = useAdventures();
  const [showForm, setShowForm] = useState(false);

  const handleFormSuccess = () => {
    setShowForm(false);
  };

  const handleFormCancel = () => {
    setShowForm(false);
  };

  if (loading) {
    return <div className='content-center'>Loading...</div>;
  }

  if (error) {
    return (
      <div className='content-center'>
        <h1>Error</h1>
        <p style={{ color: 'red' }}>{error}</p>
        <p>Check the browser console for more details</p>
      </div>
    );
  }

  const showNewAdventureBtn = adventures.length === 0 && !showForm;

  return (
    <div className='content-center'>
      {showNewAdventureBtn && (
        <NewAdventureBtn onClick={() => setShowForm(true)} />
      )}

      {showForm && (
        <AdventureForm
          onSuccess={handleFormSuccess}
          onCancel={handleFormCancel}
        />
      )}
    </div>
  );
};

export default AdventureScreen;
