import { EllipsisVerticalIcon } from 'lucide-react';
import { FCProps } from '@/types/fcProps.type';
import './BlockDragHandle.css';
import { GlassPanel } from '../../../../../GlassPanel/GlassPanel';

type Props = {
  ref: React.Ref<HTMLDivElement>;
  top: number;
  // The left edge of the block the handle belongs to; the handle sits directly left of it.
  blockLeft: number;
  height: number;
};

export const BlockDragHandle: FCProps<Props> = ({
  ref,
  top,
  blockLeft,
  height,
}) => {
  const positionStyle = {
    '--block-drag-handle-top': `${top}px`,
    '--block-drag-handle-edge': `${blockLeft}px`,
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
