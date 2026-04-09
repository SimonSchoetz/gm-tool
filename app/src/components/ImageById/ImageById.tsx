import { useImage } from '@/data-access-layer';
import { FCProps, HtmlProps } from '@/types';

type Props = {
  imageId: string;
} & HtmlProps<'img'>;

export const ImageById: FCProps<Props> = ({ imageId, ...props }) => {
  const { imageUrl, loading } = useImage(imageId);

  if (loading) return <div>Loading image...</div>;
  if (!imageUrl) return null;

  return <img src={imageUrl} {...props} />;
};
