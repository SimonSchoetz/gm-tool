import { ActionContainer, GlassPanel } from '@/components';
import './NewItemBtn.css';
import { cn } from '@/util';

import { FCProps, HtmlProps } from '@/types';
import { useState } from 'react';
import ImagePlaceholderFrame from '../ImagePlaceholderFrame/ImagePlaceholderFrame';

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
      className={cn(
        'new-item-btn',
        className,
        hideBtn && 'animate-new-item-btn-on-click',
      )}
    >
      {type === 'adventure' && (
        <ImagePlaceholderFrame>
          <div className='new-item-btn-adventure-label'>{label}</div>
        </ImagePlaceholderFrame>
      )}
      {type === 'list-item' && (
        <GlassPanel className='new-item-btn-list-item-container'>
          <div className='new-item-btn-list-item-label'>{label}</div>
        </GlassPanel>
      )}
    </ActionContainer>
  );
};
