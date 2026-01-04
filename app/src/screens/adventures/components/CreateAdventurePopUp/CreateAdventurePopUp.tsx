import './CreateAdventurePopUp.css';
import { PopUpContainer } from '@/components';
import { FCProps, HtmlProps } from '@/types';
import { useState } from 'react';
import { NewAdventureBtn } from '../NewAdventureBtn/NewAdventureBtn';
import AdventureForm from './AdventureForm/AdventureForm';
import { cn } from '@/util';

type PopUpState = React.ComponentProps<typeof PopUpContainer>['state'];

const CreateAdventurePopUp: FCProps<HtmlProps<'div'>> = () => {
  const [popUpState, setPopUpState] = useState<PopUpState>('closed');
  const [hasValues, setHasValues] = useState(false);
  const [hideBtn, setHideBtn] = useState(false);

  const handleOpenForm = () => {
    setHideBtn(true);
    const timeoutId = setTimeout(() => {
      setPopUpState('open');
    }, 500);
    return () => clearTimeout(timeoutId);
  };

  const handleCloseForm = () => {
    setHideBtn(false);
    setPopUpState('closed');
  };

  const handleFormSuccess = () => {
    handleCloseForm();
  };

  const handleFormCancel = () => {
    handleCloseForm();
  };

  return (
    <>
      <NewAdventureBtn
        onClick={handleOpenForm}
        label='Create new adventure'
        className={cn(hideBtn && 'activated')}
      >
        <div className='plus-symbol'>+</div>
      </NewAdventureBtn>
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
    </>
  );
};

export default CreateAdventurePopUp;
