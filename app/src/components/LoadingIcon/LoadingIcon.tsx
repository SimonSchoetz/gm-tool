import type { CSSProperties } from 'react';
import { FCProps } from '@/types/fcProps.type';
import './LoadingIcon.css';

type Props = {
  beamLengthPercent?: number;
};

const SIZE = 16;
const STROKE_WIDTH = 1;

export const LoadingIcon: FCProps<Props> = ({ beamLengthPercent = 50 }) => {
  const sideLength = SIZE - STROKE_WIDTH;
  const perimeter = 4 * sideLength;
  const beamLength = sideLength * 4 * (beamLengthPercent / 100);
  const gap = perimeter - beamLength;

  return (
    <svg
      className='loading-icon'
      role='img'
      aria-label='Loading'
      width={SIZE}
      height={SIZE}
      style={{ '--loading-icon-perimeter': `${perimeter}px` } as CSSProperties}
    >
      <rect
        className='loading-icon-beam'
        x={STROKE_WIDTH / 2}
        y={STROKE_WIDTH / 2}
        width={sideLength}
        height={sideLength}
        strokeWidth={STROKE_WIDTH}
        strokeDasharray={`${beamLength} ${gap}`}
      />
    </svg>
  );
};
