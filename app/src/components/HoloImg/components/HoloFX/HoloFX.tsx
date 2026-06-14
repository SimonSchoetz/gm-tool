import { FCProps } from '@/types';
import { cn } from '@/util';
import './HoloFX.css';

type Props = {
  isActive: boolean;
};

export const HoloFX: FCProps<Props> = ({ isActive }) => {
  return (
    <div className={cn('holo-fx-container', isActive && 'active')}>
      <div className='holo-fx-glare' />
    </div>
  );
};
