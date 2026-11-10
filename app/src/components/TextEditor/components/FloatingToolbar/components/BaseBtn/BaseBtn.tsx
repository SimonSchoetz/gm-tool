import { ActionContainer } from '../../../../../ActionContainer/ActionContainer';
import { GlassPanel } from '../../../../../GlassPanel/GlassPanel';
import { FCProps } from '@/types/fcProps.type';
import { cn } from '@/util/className';
import { LucideIcon } from 'lucide-react';
import { getBtnIntensity } from './helper/getBtnIntensity';
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
  const intensity = getBtnIntensity(isActive);

  return (
    <GlassPanel
      data-active={isActive}
      intensity={intensity}
      className={cn(
        'global-btn-styles',
        'base-btn-container',
        isActive && 'active',
      )}
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
