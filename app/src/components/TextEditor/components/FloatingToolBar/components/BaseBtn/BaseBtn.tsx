import { ActionContainer, GlassPanel } from '@/components';
import { FCProps } from '@/types';
import { cn } from '@/util';
import { LucideIcon } from 'lucide-react';
import './BaseBtn.css';

type Props = {
  isActive: boolean;
  onClick: () => void;
  label: string;
  icon: LucideIcon;
};

export const BaseBtn: FCProps<Props> = ({
  isActive,
  onClick,
  label,
  icon: Icon,
  ...props
}) => {
  return (
    <GlassPanel
      data-active={isActive}
      radius='md'
      intensity={isActive ? 'bright' : 'off'}
      className={cn('button', isActive && 'active')}
    >
      <ActionContainer
        className='base-btn'
        label={label}
        onClick={onClick}
        {...props}
      >
        <Icon />
      </ActionContainer>
    </GlassPanel>
  );
};
