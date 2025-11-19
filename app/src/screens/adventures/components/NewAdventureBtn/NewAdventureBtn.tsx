import { ActionCard, GlassPanel } from '@/components';
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
    }, 500);
  };

  return (
    <ActionCard
      className={cn('new-adventure-btn', isClicked && 'activated')}
      onClick={handleClick}
    >
      <GlassPanel className='plus-symbol-container'>
        <div className='plus-symbol'>+</div>
      </GlassPanel>
    </ActionCard>
  );
};

export default NewAdventureBtn;
