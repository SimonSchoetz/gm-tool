import { cn } from '@/util';
import type { FCProps } from '@/types';
import './StatusDot.css';

type Props = {
  connected: boolean;
};

export const StatusDot: FCProps<Props> = ({ connected }) => (
  <span className={cn('status-dot', connected && 'status-dot--connected')} />
);
