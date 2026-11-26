import { FCProps } from '@/types/fcProps.type';
import { QUEUE_ENTRY_IMAGE_SIZE } from '../../EncounterQueueEntry.constants';
import { buildTempFramePaths } from './helper/buildTempFramePaths';
import './EncounterQueueEntryTempFrame.css';

const STROKE_WIDTH = 3;
const EDGE_WIDTH = 5;

type Props = {
  share: number;
};

export const EncounterQueueEntryTempFrame: FCProps<Props> = ({ share }) => {
  // An inset of half the edge width keeps the whole edge inside the image, which clips what overflows it.
  const paths = buildTempFramePaths(EDGE_WIDTH / 2);
  const viewBox = `0 0 ${QUEUE_ENTRY_IMAGE_SIZE} ${QUEUE_ENTRY_IMAGE_SIZE}`;
  const dashArray = `${share} 1`;
  // Both edge halves come before both strokes, so no edge paints over a stroke where the halves meet.
  const layers = [
    {
      key: 'edge-left',
      className: 'encounter-queue-entry-temp-frame-edge',
      width: EDGE_WIDTH,
      d: paths.left,
    },
    {
      key: 'edge-right',
      className: 'encounter-queue-entry-temp-frame-edge',
      width: EDGE_WIDTH,
      d: paths.right,
    },
    {
      key: 'stroke-left',
      className: 'encounter-queue-entry-temp-frame-stroke',
      width: STROKE_WIDTH,
      d: paths.left,
    },
    {
      key: 'stroke-right',
      className: 'encounter-queue-entry-temp-frame-stroke',
      width: STROKE_WIDTH,
      d: paths.right,
    },
  ];

  return (
    <svg
      className='encounter-queue-entry-temp-frame'
      viewBox={viewBox}
      role='img'
      aria-label='Temp HP frame'
    >
      {layers.map((layer) => (
        <path
          key={layer.key}
          className={layer.className}
          d={layer.d}
          strokeWidth={layer.width}
          pathLength={1}
          strokeDasharray={dashArray}
        />
      ))}
    </svg>
  );
};
