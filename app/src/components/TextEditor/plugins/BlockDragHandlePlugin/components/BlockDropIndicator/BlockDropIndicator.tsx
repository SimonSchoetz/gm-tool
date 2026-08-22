import { FCProps } from '@/types';
import './BlockDropIndicator.css';
import { SquareArrowRightEnterIcon } from 'lucide-react';

type Props = {
  ref: React.Ref<HTMLDivElement>;
};

export const BlockDropIndicator: FCProps<Props> = ({ ref }) => (
  <div ref={ref} className='block-drop-indicator'>
    <SquareArrowRightEnterIcon />
  </div>
);
