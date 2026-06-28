import type { CSSProperties } from 'react';
import { FCProps } from '@/types';
import './LoadingIcon.css';

type Props = {
  size?: number;
};

const STROKE_WIDTH = 2;

export const LoadingIcon: FCProps<Props> = ({ size = 16 }) => {
  const sideLength = size - STROKE_WIDTH;
  const perimeter = 4 * sideLength;
  const beamLength = sideLength;
  const gap = perimeter - beamLength;

  return (
    <svg
      className="loading-icon"
      width={size}
      height={size}
      style={{ '--loading-icon-perimeter': `${perimeter}px` } as CSSProperties}
    >
      <rect
        className="loading-icon-beam"
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
