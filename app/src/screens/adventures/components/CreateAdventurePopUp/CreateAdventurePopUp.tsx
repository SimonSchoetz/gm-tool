import './CreateAdventurePopUp.css';
import { PopUpContainer } from '@/components';
import { FCProps, HtmlProps } from '@/types';
import { useState } from 'react';
import AdventureBtn from '../AdventureBtn/AdventureBtn';
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
      <AdventureBtn
        onClick={handleOpenForm}
        label='Create new adventure'
        className={cn(hideBtn && 'activated')}
        withHoloFX={false}
      >
        <div className='plus-symbol'>+</div>
      </AdventureBtn>
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
