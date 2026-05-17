import { ActionContainer, GlassPanel } from '@/components';
import './NewItemBtn.css';
import { cn } from '@/util';

import { FCProps } from '@/types';
import { CSSProperties, useState } from 'react';
import { PlusIcon } from 'lucide-react';

type Props = React.ComponentProps<typeof ActionContainer>;

const ANIMATION_DURATION = 500;

export const NewItemBtn: FCProps<Props> = ({ className, ...props }) => {
  const [hideBtn, setHideBtn] = useState(false);

  const letAnimationPlayBeforeAction = () => {
    setHideBtn(true);
    const timeoutId = setTimeout(props.onClick, ANIMATION_DURATION);
    return () => {
      clearTimeout(timeoutId);
    };
  };

  return (
    <ActionContainer
      onClick={letAnimationPlayBeforeAction}
      className={cn(
        'ni-btn',
        className,
        hideBtn && 'ni-btn-animation-on-click',
      )}
      style={
        {
          '--ni-btn-animation-duration': `${ANIMATION_DURATION}ms`,
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
