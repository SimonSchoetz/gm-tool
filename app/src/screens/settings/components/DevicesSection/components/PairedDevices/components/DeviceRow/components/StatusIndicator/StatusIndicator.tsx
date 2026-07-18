import type { FCProps } from '@/types';
import './StatusIndicator.css';
import { GlobeCheckIcon, GlobeLockIcon, GlobeOffIcon } from 'lucide-react';
import type { PeerStatus } from '../../helper';

type Props = {
  status: PeerStatus;
};

export const StatusIndicator: FCProps<Props> = ({ status }) => {
  if (status === 'connected') {
    return <GlobeCheckIcon className='status-indicator--connected' />;
  }
  if (status === 'incompatible') {
    return <GlobeLockIcon className='status-indicator--incompatible' />;
  }
  return <GlobeOffIcon className='status-indicator--disconnected' />;
};
