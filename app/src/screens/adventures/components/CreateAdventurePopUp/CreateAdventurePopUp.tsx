import { PopUpContainer } from '@/components';
import { FCProps, HtmlProps } from '@/types';
import { useState } from 'react';
import AdventureBtn from '../AdventureBtn/AdventureBtn';
import AdventureForm from '../AdventureForm/AdventureForm';

type PopUpState = React.ComponentProps<typeof PopUpContainer>['state'];

const CreateAdventurePopUp: FCProps<HtmlProps<'div'>> = () => {
  const [popUpState, setPopUpState] = useState<PopUpState>('closed');

  const handleOpenForm = () => {
    setPopUpState('open');
  };

  const handleFormSuccess = () => {
    setPopUpState('closed');
  };

  const handleFormCancel = () => {
    setPopUpState('closed');
  };
  const showBtn = popUpState === 'closed';
  return (
    <div className='content-center'>
      {showBtn && <AdventureBtn onClick={handleOpenForm} type='create' />}
      <PopUpContainer
        state={popUpState}
        setState={setPopUpState}
        enforceCancelBtn={true}
      >
        <AdventureForm
          onSuccess={handleFormSuccess}
          onCancel={handleFormCancel}
        />
      </PopUpContainer>
    </div>
  );
};

export default CreateAdventurePopUp;
