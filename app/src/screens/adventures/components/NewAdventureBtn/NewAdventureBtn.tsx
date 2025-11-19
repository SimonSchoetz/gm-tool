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
    setTimeout(() => {
      onClick();
      setIsClicked(false);
    }, 500);
  };

  return (
    <ActionContainer
      className={cn('new-adventure-btn', isClicked && 'activated')}
      onClick={handleClick}
    >
      <GlassPanel className='plus-symbol-container'>
        <div className='plus-symbol'>+</div>
      </GlassPanel>
    </ActionContainer>
  );
};

export default NewAdventureBtn;
