import { FCProps } from '@/types';
import { cn } from '@/util';
import './HoloFX.css';
import { type TiltFX } from '../../hooks';
import { type CSSProperties } from 'react';

type Props = {
  tiltFX: TiltFX;
};

export const HoloFX: FCProps<Props> = ({ tiltFX }) => {
  const glareBaseDimensions = 250;
  return (
    <div className={cn('holo-fx-container', tiltFX.isActive && 'active')}>
      <div
        className='holo-fx-glare'
        style={
          {
            '--glare-position-x': `${100 - tiltFX.cursorXPercent}%`,
            '--glare-position-y': `${100 - tiltFX.cursorYPercent}%`,
            '--glare-base-dimensions': `${glareBaseDimensions}%`,
            '--glare-ellipse-x': `${glareBaseDimensions * tiltFX.ratioX * tiltFX.distanceFromCenterX}%`,
            '--glare-ellipse-y': `${glareBaseDimensions * tiltFX.ratioY * tiltFX.distanceFromCenterY}%`,
            '--glare-distance-from-center': String(tiltFX.distanceFromCenter),
          } as CSSProperties
        }
      />
    </div>
  );
};
