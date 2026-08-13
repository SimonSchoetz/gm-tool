import { FCProps } from '@/types';
import { GlassPanel } from '../GlassPanel/GlassPanel';
import { cn } from '@/util';
import './PopupSurface.css';

type Props = React.ComponentProps<typeof GlassPanel>;

export const PopupSurface: FCProps<Props> = ({
  className,
  children,
  ...props
}) => {
  return (
    <GlassPanel className={cn('popup-surface', className)} {...props}>
      {children}
    </GlassPanel>
  );
};
