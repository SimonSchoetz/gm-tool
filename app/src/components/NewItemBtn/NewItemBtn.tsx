import { ActionContainer, GlassPanel } from '@/components';
import './NewItemBtn.css';
import { cn } from '@/util';

import { FCProps, HtmlProps } from '@/types';
import { useState } from 'react';
import AdventureFrame from '../AdventureComponents/AdventureFrame/AdventureFrame';

type Props = {
  type: 'adventure' | 'list-item';
  label: string;
  onClick: () => void;
} & HtmlProps<'div'>;

export const NewItemBtn: FCProps<Props> = ({
  type = 'list-item',
  label,
  onClick,
  className,
}) => {
  const [hideBtn, setHideBtn] = useState(false);

  const letAnimationPlayBeforeAction = () => {
    setHideBtn(true);
    const timeoutId = setTimeout(onClick, 500);
    return () => clearTimeout(timeoutId);
  };

  return (
    <ActionContainer
      onClick={letAnimationPlayBeforeAction}
      label={'Create new adventure'}
      className={cn('new-item-btn', hideBtn && 'activated')}
    >
      {type === 'adventure' && (
        <AdventureFrame className={cn(className)}>
          <div className='new-item-btn-label adventure'>{label}</div>
        </AdventureFrame>
      )}
      {type === 'list-item' && (
        <GlassPanel className={cn(className)}>
          <div className='new-item-btn-label list-item'>{label}</div>
        </GlassPanel>
      )}
    </ActionContainer>
  );
};
