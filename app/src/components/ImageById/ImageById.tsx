import { useEffect, useState } from 'react';
import { useImages } from '@/data-access-layer/images';
import { getImageUrl } from '@/util';
import { FCProps, HtmlProps } from '@/types';

type Props = {
  imageId: string | null | undefined;
} & HtmlProps<'img'>;

export const ImageById: FCProps<Props> = ({ imageId, ...props }) => {
  const { getImageById } = useImages();
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!imageId) {
      setImageUrl(null);
      return;
    }

    const loadImage = async () => {
      setLoading(true);
      try {
        const image = await getImageById(imageId);
        if (image) {
          const url = await getImageUrl(image.id, image.file_extension);
          setImageUrl(url);
        }
      } catch (error) {
        console.error('Failed to load image:', error);
      } finally {
        setLoading(false);
      }
    };

    loadImage();
  }, [imageId, getImageById]);

  if (!imageId || !imageUrl) {
    return null;
  }

  if (loading) {
    return <div>Loading image...</div>;
  }

  return <img src={imageUrl} {...props} />;
};
