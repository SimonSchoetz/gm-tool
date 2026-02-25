import { useImage } from '@/data-access-layer/images';
import { FCProps, HtmlProps } from '@/types';

type Props = {
  imageId: string | null | undefined;
} & HtmlProps<'img'>;

export const ImageById: FCProps<Props> = ({ imageId, ...props }) => {
  const { imageUrl, loading } = useImage(imageId);

  if (!imageId) return null;
  if (loading) return <div>Loading image...</div>;
  if (!imageUrl) return null;

  return <img src={imageUrl} {...props} />;
};
