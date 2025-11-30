import { ActionContainer } from '@/components';
import './NewAdventureBtn.css';
import { useState } from 'react';
import { cn } from '@/util';
import AdventureFrame from '../AdventureFrame/AdventureFrame';

type Props = {
  onClick: () => void;
};

const NewAdventureBtn = ({ onClick }: Props) => {
  const [isClicked, setIsClicked] = useState<boolean>();
  const handleClick = () => {
    setIsClicked(true);
    const timeoutId = setTimeout(() => {
      onClick();
      setIsClicked(false);
    }, 500);
    return () => clearTimeout(timeoutId);
  };

  return (
    <AdventureFrame
      className={cn('new-adventure-btn', isClicked && 'activated')}
    >
      <ActionContainer
        className='plus-symbol-container'
        onClick={handleClick}
        aria-label='Create new adventure'
      >
        <div className='plus-symbol'>+</div>
      </ActionContainer>
    </AdventureFrame>
  );
};

export default NewAdventureBtn;
