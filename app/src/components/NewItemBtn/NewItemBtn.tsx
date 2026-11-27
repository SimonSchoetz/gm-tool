import { ActionContainer } from '../ActionContainer/ActionContainer';
import { GlassPanel } from '../GlassPanel/GlassPanel';
import './NewItemBtn.css';
import { cn } from '@/util/className';

import { FCProps } from '@/types/fcProps.type';
import { CSSProperties, useState } from 'react';
import { PlusIcon } from 'lucide-react';
import { getActionDelay } from './helper/getActionDelay';
import { ANIMATION_DURATION } from './NewItemBtn.constants';

type Props = {
  suppressAnimation?: boolean;
} & Omit<React.ComponentProps<typeof ActionContainer>, 'style' | 'children'>;

export const NewItemBtn: FCProps<Props> = ({
  className,
  onClick,
  suppressAnimation,
  ...props
}) => {
  const [hideBtn, setHideBtn] = useState(false);

  const letAnimationPlayBeforeAction = () => {
    setHideBtn(true);
    setTimeout(
      () => onClick?.({} as React.MouseEvent<HTMLButtonElement>),
      getActionDelay(suppressAnimation),
    );
  };

  return (
    <ActionContainer
      onClick={letAnimationPlayBeforeAction}
      className={cn(
        'ni-btn',
        className,
        !suppressAnimation && hideBtn && 'ni-btn-animation-on-click',
      )}
      style={
        {
          '--new-item-btn-animation-duration': `${ANIMATION_DURATION}ms`,
        } as CSSProperties
      }
      {...props}
    >
      <GlassPanel className='ni-btn-content-container content-center'>
        <PlusIcon className='ni-btn-icon' />
      </GlassPanel>
    </ActionContainer>
  );
};
