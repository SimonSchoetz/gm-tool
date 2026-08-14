import { EllipsisVerticalIcon } from 'lucide-react';
import { FCProps } from '@/types';
import './BlockDragHandle.css';
import { GlassPanel } from '@/components';

type Props = {
  ref: React.Ref<HTMLDivElement>;
  barHeight: number | null;
  anchorHeight: number | null;
};

export const BlockDragHandle: FCProps<Props> = ({
  ref,
  barHeight,
  anchorHeight,
}) => (
  <div
    ref={ref}
    className='block-drag-handle-anchor'
    style={
      anchorHeight !== null
        ? ({
            '--block-drag-handle-anchor-height': `${anchorHeight}px`,
          } as React.CSSProperties)
        : undefined
    }
  >
    <GlassPanel
      intensity='off'
      className='block-drag-handle'
      style={
        barHeight !== null
          ? ({
              '--block-drag-handle-height': `${barHeight}px`,
            } as React.CSSProperties)
          : undefined
      }
    >
      <EllipsisVerticalIcon />
    </GlassPanel>
  </div>
);
