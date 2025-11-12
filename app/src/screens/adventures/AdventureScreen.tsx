import { useState } from 'react';
import { ActionCard } from '@/components';
import { useAdventures } from '@/data/adventures';
import AdventureForm from './components/AdventureForm';
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

  // Decide what to show
  const shouldShowEmptyState = adventures.length === 0 && !showForm;
  const shouldShowForm = showForm;

  return (
    <div className='content-center'>
      {shouldShowEmptyState && (
        <ActionCard
          className='new-adventure-btn'
          onClick={() => setShowForm(true)}
        >
          <div className='plus-symbol'>+</div>
        </ActionCard>
      )}

      {shouldShowForm && (
        <AdventureForm onSuccess={handleFormSuccess} onCancel={handleFormCancel} />
      )}
    </div>
  );
};

export default AdventureScreen;
