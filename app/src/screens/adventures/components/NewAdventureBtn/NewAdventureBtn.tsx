import { ActionContainer, GlassPanel } from '@/components';
import './NewAdventureBtn.css';
import { useState } from 'react';
import { cn } from '@/util';

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
    <ActionContainer
      className={cn('new-adventure-btn', isClicked && 'activated')}
      onClick={handleClick}
      aria-label='Create new adventure'
    >
      <GlassPanel className='plus-symbol-container'>
        <div className='plus-symbol'>+</div>
      </GlassPanel>
    </ActionContainer>
  );
};

export default NewAdventureBtn;
