import { FCProps } from '@/types';
import { ActionContainer } from '.././../../../../../../ActionContainer/ActionContainer';
import { GlassPanel } from '.././../../../../../../GlassPanel/GlassPanel';
import { LucideIcon } from 'lucide-react';
import { cn } from '@/util';

type Props = { Icon: LucideIcon; isActive?: boolean } & React.ComponentProps<
  typeof ActionContainer
>;

export const TableHandleMenuItem: FCProps<Props> = ({
  Icon,
  label,
  className,
  isActive,
  ...props
}) => {
  return (
    <ActionContainer
      label={label}
      type='button'
      className={cn('TEP--li', isActive && 'TEP--li--active', className)}
      {...props}
    >
      <GlassPanel
        intensity={isActive ? 'bright' : 'dim'}
        className='TEP--li-icon-container'
      >
        <Icon />
      </GlassPanel>
      <span>{label}</span>
    </ActionContainer>
  );
};
