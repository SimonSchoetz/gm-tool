import { EllipsisVerticalIcon } from 'lucide-react';
import { FCProps } from '@/types/fcProps.type';
import './BlockDragHandle.css';
import { GlassPanel } from '../../../../../GlassPanel/GlassPanel';

type Props = {
  ref: React.Ref<HTMLDivElement>;
  top: number;
  height: number;
};

export const BlockDragHandle: FCProps<Props> = ({ ref, top, height }) => {
  const positionStyle = {
    '--block-drag-handle-top': `${top}px`,
    '--block-drag-handle-height': `${height}px`,
  } as React.CSSProperties;

  return (
    <GlassPanel
      ref={ref}
      intensity='off'
      draggable
      aria-label='Drag to move block'
      className='block-drag-handle'
      style={positionStyle}
    >
      <EllipsisVerticalIcon />
    </GlassPanel>
  );
};
