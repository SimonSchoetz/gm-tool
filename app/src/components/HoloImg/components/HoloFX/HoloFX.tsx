import { FCProps } from '@/types';
import { Glare, Shimmer } from './components';
import { cn } from '@/util';
import './HoloFX.css';

type Props = {
  isActive: boolean;
};

export const HoloFX: FCProps<Props> = ({ isActive }) => {
  return (
    <div className={cn('holo-fx-container', isActive && 'active')}>
      <Glare />
      {/*<Shimmer />*/}
    </div>
  );
};
