import { GripVerticalIcon } from 'lucide-react';
import { FCProps } from '@/types';
import './BlockDragHandle.css';

type Props = {
  ref: React.Ref<HTMLDivElement>;
};

export const BlockDragHandle: FCProps<Props> = ({ ref }) => (
  <div ref={ref} className='block-drag-handle'>
    <GripVerticalIcon />
  </div>
);
