import { FCProps } from '@/types';
import { ActionContainer } from '../ActionContainer/ActionContainer';
import { GlassPanel } from '../GlassPanel/GlassPanel';
import { LucideIcon } from 'lucide-react';
import { cn } from '@/util';
import './MenuOptionRow.css';

type Props = {
  Icon: LucideIcon;
  isActive?: boolean;
  isSelected?: boolean;
} & React.ComponentProps<typeof ActionContainer>;

export const MenuOptionRow: FCProps<Props> = ({
  Icon,
  label,
  className,
  isActive,
  isSelected,
  ...props
}) => {
  return (
    <ActionContainer
      label={label}
      type='button'
      className={cn(
        'menu-option-row',
        isActive && 'menu-option-row--active',
        isSelected && 'menu-option-row--selected',
        className,
      )}
      {...props}
    >
      <GlassPanel
        intensity={isActive ? 'bright' : 'dim'}
        className='menu-option-row-icon'
      >
        <Icon />
      </GlassPanel>
      <span>{label}</span>
    </ActionContainer>
  );
};
