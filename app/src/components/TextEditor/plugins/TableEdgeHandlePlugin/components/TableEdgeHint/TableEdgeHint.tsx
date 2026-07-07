import { FCProps } from '@/types';
import { cn } from '@/util';
import type { HintDirection } from '../../TableEdgeHandlePlugin';
import {
  TABLE_HINT_THICKNESS,
  TABLE_HINT_WIDTH,
} from '../../tableEdgeHandlePlugin.constants';
import { calculateHintPosition } from './helper';
import './TableEdgeHint.css';
import { EllipsisIcon, EllipsisVerticalIcon } from 'lucide-react';

type Props = {
  direction: HintDirection;
  axisClass: 'horizontal' | 'vertical';
  type: 'row' | 'column';
  show: boolean;
  active: boolean;
  cellRect: DOMRect;
  onMouseEnter: (direction: HintDirection) => void;
  onMouseLeave: () => void;
  onClick: (type: 'row' | 'column', element: HTMLDivElement) => void;
};

export const TableEdgeHint: FCProps<Props> = ({
  direction,
  axisClass,
  type,
  show,
  active,
  cellRect,
  onMouseEnter,
  onMouseLeave,
  onClick,
}) => {
  const { top, left } = calculateHintPosition(direction, cellRect);
  return (
    <div
      className={cn(
        'table-edge-hint',
        `table-edge-hint--${axisClass}`,
        active && 'table-edge-hint--active',
      )}
      style={
        {
          '--table-hint-width': `${TABLE_HINT_WIDTH}px`,
          '--table-hint-thickness': `${TABLE_HINT_THICKNESS}px`,
          '--calculated-top': `${top}px`,
          '--calculated-left': `${left}px`,
          display: show ? undefined : 'none',
        } as React.CSSProperties
      }
      onMouseDown={(e) => {
        e.stopPropagation();
      }}
      onMouseEnter={() => {
        onMouseEnter(direction);
      }}
      onMouseLeave={onMouseLeave}
      onClick={(e) => {
        onClick(type, e.currentTarget);
      }}
    >
      {axisClass === 'horizontal' ? (
        <EllipsisIcon className='table-edge-hint--icon' />
      ) : (
        <EllipsisVerticalIcon className='table-edge-hint--icon' />
      )}
      <div className='growing-hint' />
    </div>
  );
};
