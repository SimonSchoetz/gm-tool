import { FCProps, HtmlProps } from '@/types';
import { useRef, type CSSProperties } from 'react';
import { cn } from '@/util';
import { ImageById } from '../ImageById/ImageById';
import './HoloImg.css';
import ImagePlaceholderFrame from '../ImagePlaceholderFrame/ImagePlaceholderFrame';
import { useTiltFX } from './hooks';
import { HoloFX, HoloImgTitle } from './components';

type Props = {
  image_id: string | null;
  title: string;
  dimensions: React.ComponentProps<typeof ImagePlaceholderFrame>['dimensions'];
} & HtmlProps<'div'>;

export const HoloImg: FCProps<Props> = ({
  image_id,
  title,
  className,
  dimensions,
  ...props
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const tiltFX = useTiltFX(containerRef);
  return (
    <div
      ref={containerRef}
      style={
        {
          '--tilt-fx-rotation-x-degrees': `${tiltFX.rotationX}deg`,
          '--tilt-fx-rotation-y-degrees': `${tiltFX.rotationY}deg`,
        } as CSSProperties
      }
      className='tilt-fx-container'
      {...props}
    >
      <ImagePlaceholderFrame
        dimensions={dimensions}
        className={cn('tilt-fx', tiltFX.isActive && 'active', className)}
      >
        <HoloFX tiltFX={tiltFX} />

        <HoloImgTitle
          title={title}
          tiltFX={tiltFX}
          className={cn(!image_id && 'always-active')}
        />

        {image_id && (
          <ImageById
            imageId={image_id}
            alt={title}
            className={cn('holo-img', tiltFX.isActive && 'active')}
          />
        )}
      </ImagePlaceholderFrame>
    </div>
  );
};
