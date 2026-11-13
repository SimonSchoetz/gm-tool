import { EllipsisVerticalIcon } from 'lucide-react';
import type { NodeKey } from 'lexical';
import { FCProps } from '@/types/fcProps.type';
import './BlockDragHandle.css';
import { GlassPanel } from '../../../../../GlassPanel/GlassPanel';
import { BLOCK_KEY_ATTRIBUTE } from '../../helper/handleBlockKeyOf';

type Props = {
  // The key of the block this handle moves.
  blockKey: NodeKey;
  top: number;
  // The left edge of the block the handle belongs to; the handle sits directly left of it.
  blockLeft: number;
  height: number;
};

export const BlockDragHandle: FCProps<Props> = ({
  blockKey,
  top,
  blockLeft,
  height,
}) => {
  const positionStyle = {
    '--block-drag-handle-top': `${top}px`,
    '--block-drag-handle-edge': `${blockLeft}px`,
    '--block-drag-handle-height': `${height}px`,
  } as React.CSSProperties;

  const blockKeyAttribute = { [BLOCK_KEY_ATTRIBUTE]: blockKey };

  return (
    <GlassPanel
      intensity='off'
      draggable
      aria-label='Drag to move block'
      className='block-drag-handle'
      style={positionStyle}
      {...blockKeyAttribute}
    >
      <EllipsisVerticalIcon />
    </GlassPanel>
  );
};
