import { useImage } from '@/data-access-layer';
import { FCProps, HtmlProps } from '@/types';
import { cn } from '@/util';
import './ImageById.css';

type Props = {
  imageId: string | null;
  fullImage?: boolean;
} & HtmlProps<'img'>;

export const ImageById: FCProps<Props> = ({
  imageId,
  style,
  className,
  fullImage = false,
  ...props
}) => {
  const { imageUrl, loading, frame } = useImage(imageId);

  if (loading) return <div>Loading image...</div>;
  if (!imageUrl) return null;

  const frameStyles =
    !fullImage && frame !== null
      ? ({
          '--rt-holo-img-frame-x': `${frame.x}%`,
          '--rt-holo-img-frame-y': `${frame.y}%`,
          '--rt-holo-img-frame-zoom': frame.zoom,
        } as React.CSSProperties)
      : {};

  return (
    <img
      src={imageUrl}
      style={{ ...frameStyles, ...style }}
      className={cn('image-by-id', className)}
      {...props}
    />
  );
};
