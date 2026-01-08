import { FCProps } from '@/types';
import './AdventureScreen.css';
import { GlassPanel } from '@/components';
import { cn } from '@/util';

type Props = object;

export const AdventureScreen: FCProps<Props> = ({ ...props }) => {
  return (
    <GlassPanel className={cn('adventure-screen')} {...props}>
      AdventureScreen
    </GlassPanel>
  );
};
