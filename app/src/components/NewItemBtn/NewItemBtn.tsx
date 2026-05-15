import { ActionContainer, GlassPanel } from '@/components';
import './NewItemBtn.css';
import { cn } from '@/util';

import { FCProps, HtmlProps } from '@/types';
import { useState } from 'react';
import ImagePlaceholderFrame from '../ImagePlaceholderFrame/ImagePlaceholderFrame';

type Props = {
  dimensions?: React.ComponentProps<typeof ImagePlaceholderFrame>['dimensions'];
  label: string;
  onClick: () => void;
} & HtmlProps<'div'>;

export const NewItemBtn: FCProps<Props> = ({
  dimensions,
  label,
  onClick,
  className,
}) => {
  const [hideBtn, setHideBtn] = useState(false);

  const letAnimationPlayBeforeAction = () => {
    setHideBtn(true);
    const timeoutId = setTimeout(onClick, 500);
    return () => {
      clearTimeout(timeoutId);
    };
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
      {dimensions ? (
        <ImagePlaceholderFrame dimensions={dimensions}>
          <div className='new-item-btn-adventure-label'>{label}</div>
        </ImagePlaceholderFrame>
      ) : (
        <GlassPanel className='new-item-btn-list-item-container'>
          <div className='new-item-btn-list-item-label'>{label}</div>
        </GlassPanel>
      )}
    </ActionContainer>
  );
};
