import { ActionContainer } from '@/components';
import './NewAdventureBtn.css';
import { cn } from '@/util';

import { FCProps, HtmlProps } from '@/types';
import { useState } from 'react';
import AdventureFrame from '../AdventureFrame/AdventureFrame';

export const NewAdventureBtn: FCProps<HtmlProps<'div'>> = ({ className }) => {
  const [hideBtn, setHideBtn] = useState(false);

  const handleOpenForm = () => {
    setHideBtn(true);
    const timeoutId = setTimeout(() => {}, 500);
    return () => clearTimeout(timeoutId);
  };

  return (
    <ActionContainer
      onClick={handleOpenForm}
      label={'Create new adventure'}
      role='button'
      className={cn('new-adventure-btn', hideBtn && 'activated')}
    >
      <AdventureFrame className={cn(className)}>
        <div className='plus-symbol'>+</div>
      </AdventureFrame>
    </ActionContainer>
  );
};
