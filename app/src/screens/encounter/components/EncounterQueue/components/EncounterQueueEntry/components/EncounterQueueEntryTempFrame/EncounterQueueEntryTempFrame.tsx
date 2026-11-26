import type { CSSProperties } from 'react';
import { FCProps } from '@/types/fcProps.type';
import { QUEUE_ENTRY_IMAGE_SIZE } from '../../EncounterQueueEntry.constants';
import { TEMP_FRAME_EDGE_WIDTH } from './EncounterQueueEntryTempFrame.constants';
import { computeTempFrameReach } from './helper/computeTempFrameReach';
import './EncounterQueueEntryTempFrame.css';

const STROKE_WIDTH = 3;
// A copy of --radius-lg (0.75rem at the 16 px root font), the corner radius of .encounter-queue-entry-image: an SVG outline needs it as a number.
const QUEUE_ENTRY_IMAGE_RADIUS = 12;

type Props = {
  share: number;
};

export const EncounterQueueEntryTempFrame: FCProps<Props> = ({ share }) => {
  // An inset of half the edge width keeps the whole edge inside the image, which clips what overflows it.
  const inset = TEMP_FRAME_EDGE_WIDTH / 2;
  const outlineSize = QUEUE_ENTRY_IMAGE_SIZE - TEMP_FRAME_EDGE_WIDTH;
  const outlineRadius = QUEUE_ENTRY_IMAGE_RADIUS - inset;
  const viewBox = `0 0 ${QUEUE_ENTRY_IMAGE_SIZE} ${QUEUE_ENTRY_IMAGE_SIZE}`;
  const reach = computeTempFrameReach(share);
  // The edge comes before the stroke, so it paints under it.
  const layers = [
    {
      className: 'encounter-queue-entry-temp-frame-edge',
      width: TEMP_FRAME_EDGE_WIDTH,
    },
    {
      className: 'encounter-queue-entry-temp-frame-stroke',
      width: STROKE_WIDTH,
    },
  ];

  return (
    <svg
      className='encounter-queue-entry-temp-frame'
      style={
        {
          '--rt-encounter-queue-entry-temp-frame-reach': reach,
        } as CSSProperties
      }
      viewBox={viewBox}
      role='img'
      aria-label='Temp HP frame'
    >
      {layers.map((layer) => (
        <rect
          key={layer.className}
          className={layer.className}
          x={inset}
          y={inset}
          width={outlineSize}
          height={outlineSize}
          rx={outlineRadius}
          strokeWidth={layer.width}
        />
      ))}
    </svg>
  );
};
