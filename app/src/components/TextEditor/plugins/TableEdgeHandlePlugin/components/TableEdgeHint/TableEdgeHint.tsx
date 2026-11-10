import { FCProps } from '@/types/fcProps.type';
import { cn } from '@/util/className';
import type { HintDirection } from '../../TableEdgeHandlePlugin';
import {
  TABLE_HINT_THICKNESS,
  TABLE_HINT_WIDTH,
} from '../../tableEdgeHandlePlugin.constants';
import { calculateHintPosition } from './helper/calculateHintPosition';
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

  const onMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    e.stopPropagation();
  };

  const onHintMouseEnter = () => {
    onMouseEnter(direction);
  };

  const onHintClick = (e: React.MouseEvent<HTMLDivElement>) => {
    onClick(type, e.currentTarget);
  };

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
      onMouseDown={onMouseDown}
      onMouseEnter={onHintMouseEnter}
      onMouseLeave={onMouseLeave}
      onClick={onHintClick}
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
