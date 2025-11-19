import { useState } from 'react';
import { useAdventures } from '@/data/adventures';
import { PopUpContainer } from '@/components';
import { NewAdventureBtn, AdventureForm } from './components';
import './AdventureScreen.css';

const AdventureScreen = () => {
  const { adventures, loading, error } = useAdventures();
  const [popUpState, setPopUpState] = useState<'open' | 'closed'>('closed');

  const handleOpenForm = () => {
    setPopUpState('open');
  };

  const handleFormSuccess = () => {
    setPopUpState('closed');
  };

  const handleFormCancel = () => {
    setPopUpState('closed');
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

  const showBtn = popUpState === 'closed';
  return (
    <div className='content-center'>
      {showBtn && <NewAdventureBtn onClick={handleOpenForm} />}
      <PopUpContainer state={popUpState} setState={setPopUpState}>
        <AdventureForm
          onSuccess={handleFormSuccess}
          onCancel={handleFormCancel}
        />
      </PopUpContainer>
    </div>
  );
};

export default AdventureScreen;
