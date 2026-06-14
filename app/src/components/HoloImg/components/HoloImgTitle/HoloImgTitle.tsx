import { HtmlProps, FCProps } from '@/types';
import './HoloImgTitle.css';
import { cn } from '@/util';
import { type TiltFX } from '../../hooks';
import { type CSSProperties } from 'react';

type Props = HtmlProps<'div'> & {
  title: string;
  tiltFX: TiltFX;
};

export const HoloImgTitle: FCProps<Props> = ({ title, tiltFX, className }) => {
  const xOffset = tiltFX.rotationY * tiltFX.ratioX;
  const yOffset = tiltFX.rotationX * tiltFX.ratioY;
  const tiltMagnitude =
    Math.max(Math.abs(xOffset), Math.abs(yOffset)) /
    (2 * Math.max(tiltFX.ratioX, tiltFX.ratioY));

  return (
    <div
      className={cn('holo-img-title content-center', className)}
      style={
        {
          '--holo-img-x-offset': xOffset,
          '--holo-img-y-offset': yOffset,
          '--holo-img-tilt-magnitude': tiltMagnitude,
        } as CSSProperties
      }
    >
      {title}
    </div>
  );
};
