import { FCProps } from '@/types';
import { Glare, Shimmer } from './components';
import { cn } from '@/util';
import './HoloFX.css';

type Props = {
  isActive: boolean;
  shimmerContent?: string;
};

export const HoloFX: FCProps<Props> = ({ shimmerContent, isActive }) => {
  return (
    <div className={cn('holo-fx-container', isActive && 'active')}>
      <Glare />
      <Shimmer shimmerContent={shimmerContent} />
    </div>
  );
};
