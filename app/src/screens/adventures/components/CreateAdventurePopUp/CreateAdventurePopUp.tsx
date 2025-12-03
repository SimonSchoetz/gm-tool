import { PopUpContainer } from '@/components';
import { FCProps, HtmlProps } from '@/types';
import { useState } from 'react';
import AdventureBtn from '../AdventureBtn/AdventureBtn';
import AdventureForm from './AdventureForm/AdventureForm';

type PopUpState = React.ComponentProps<typeof PopUpContainer>['state'];

const CreateAdventurePopUp: FCProps<HtmlProps<'div'>> = () => {
  const [popUpState, setPopUpState] = useState<PopUpState>('closed');
  const [hasValues, setHasValues] = useState(false);

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
        enforceCancelBtn={hasValues}
      >
        <AdventureForm
          onSuccess={handleFormSuccess}
          onCancel={handleFormCancel}
          setHasValues={setHasValues}
        />
      </PopUpContainer>
    </div>
  );
};

export default CreateAdventurePopUp;
