import './CreateAdventurePopUp.css';
import { FCProps, HtmlProps } from '@/types';
import { useState } from 'react';
import { NewAdventureBtn } from '../NewAdventureBtn/NewAdventureBtn';

import { cn } from '@/util';

const CreateAdventurePopUp: FCProps<HtmlProps<'div'>> = () => {
  const [hideBtn, setHideBtn] = useState(false);

  const handleOpenForm = () => {
    setHideBtn(true);
    const timeoutId = setTimeout(() => {}, 500);
    return () => clearTimeout(timeoutId);
  };

  return (
    <NewAdventureBtn
      onClick={handleOpenForm}
      label='Create new adventure'
      className={cn(hideBtn && 'activated')}
    >
      <div className='plus-symbol'>+</div>
    </NewAdventureBtn>
  );
};

export default CreateAdventurePopUp;
