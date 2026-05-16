import { ImageById } from '@/components/ImageById/ImageById';
import { FCProps } from '@/types';
import { useEffect, useState } from 'react';
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

  const [xOffset, setXOffset] = useState(0);
  const [yOffset, setYOffset] = useState(0);

  const imageWidth = naturalSize?.w ?? 0;
  const imageHeight = naturalSize?.h ?? 0;

  const coverScale = Math.max(
    dimensions.width / imageWidth,
    dimensions.height / imageHeight,
  );

  useEffect(() => {
    if (!naturalSize) return;
    const { width, height } = dimensions;
    const { w, h } = naturalSize;
    const overWidth = w * coverScale - width;
    const overHeight = h * coverScale - height;
    const borderOffset = IPFO_FRAME_BORDER_WIDTH * 2;

    const offsetX = overWidth + borderOffset;
    setXOffset(offsetX / 2 - (frameState.x / 100) * offsetX);

    const offsetY = overHeight + borderOffset;
    setYOffset(offsetY / 2 - (frameState.y / 100) * offsetY);
  }, [dimensions, naturalSize, frameState, coverScale]);

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
