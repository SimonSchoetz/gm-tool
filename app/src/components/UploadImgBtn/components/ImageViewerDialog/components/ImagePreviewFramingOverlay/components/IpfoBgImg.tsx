import { ImageById } from '../../../../../../ImageById/ImageById';
import { FCProps } from '@/types';
import { useState } from 'react';
import './IpfoBgImg.css';
import { FrameState } from '../helper';
import { IPFO_FRAME_BORDER_WIDTH } from '../ImagePreviewFramingOverlay.constants';

type Props = {
  imageId: string;
  dimensions: { width: number; height: number };
  frameState: FrameState;
};

export const IpfoBgImg: FCProps<Props> = ({
  imageId,
  dimensions,
  frameState,
}) => {
  const [naturalSize, setNaturalSize] = useState<{
    w: number;
    h: number;
  } | null>(null);

  const imageWidth = naturalSize?.w ?? 0;
  const imageHeight = naturalSize?.h ?? 0;

  const coverScale = Math.max(
    dimensions.width / imageWidth,
    dimensions.height / imageHeight,
  );

  const borderOffset = IPFO_FRAME_BORDER_WIDTH * 2;
  const offsetX = imageWidth * coverScale - dimensions.width + borderOffset;
  const offsetY = imageHeight * coverScale - dimensions.height + borderOffset;
  const xOffset =
    naturalSize !== null ? offsetX / 2 - (frameState.x / 100) * offsetX : 0;
  const yOffset =
    naturalSize !== null ? offsetY / 2 - (frameState.y / 100) * offsetY : 0;

  const handleImageLoad = (e: React.SyntheticEvent<HTMLImageElement>) => {
    setNaturalSize({
      w: e.currentTarget.naturalWidth,
      h: e.currentTarget.naturalHeight,
    });
  };

  const bgImageStyles = {
    '--rt-ipfo-scaled-w': `${imageWidth * coverScale}px`,
    '--rt-ipfo-scaled-h': `${imageHeight * coverScale}px`,
    '--rt-ipfo-bg-x-offset': `${xOffset}px`,
    '--rt-ipfo-bg-y-offset': `${yOffset}px`,
  } as React.CSSProperties;

  return (
    <ImageById
      imageId={imageId}
      alt=''
      aria-hidden
      className='ipfo-bg-img'
      style={bgImageStyles}
      onLoad={handleImageLoad}
    />
  );
};
