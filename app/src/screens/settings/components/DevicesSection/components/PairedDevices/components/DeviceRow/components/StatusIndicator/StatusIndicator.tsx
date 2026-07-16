import type { FCProps } from '@/types';
import './StatusIndicator.css';
import { GlobeCheckIcon, GlobeOffIcon } from 'lucide-react';

type Props = {
  connected: boolean;
};

export const StatusIndicator: FCProps<Props> = ({ connected }) => {
  if (connected) {
    return <GlobeCheckIcon className='status--connected' />;
  }
  return <GlobeOffIcon className='status--disconnected' />;
};
