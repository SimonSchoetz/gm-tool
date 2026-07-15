import type { FCProps } from '@/types';
import './StatusDot.css';
import { GlobeCheckIcon, GlobeOffIcon } from 'lucide-react';

type Props = {
  connected: boolean;
};

export const StatusDot: FCProps<Props> = ({ connected }) => {
  if (connected) {
    return <GlobeCheckIcon className='status--connected' />;
  }
  return <GlobeOffIcon className='status--disconnected' />;
};
