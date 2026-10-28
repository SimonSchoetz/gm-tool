import { UserSquareIcon } from 'lucide-react';
import { ImageById } from '@/components/ImageById/ImageById';
import { ImagePlaceholderFrame } from '@/components/ImagePlaceholderFrame/ImagePlaceholderFrame';
import { FCProps } from '@/types/fcProps.type';
import './EncounterEntityImage.css';

type Props = {
  imageId: string | null;
  size: number;
};

export const EncounterEntityImage: FCProps<Props> = ({ imageId, size }) => (
  <ImagePlaceholderFrame dimensions={{ width: size, height: size }}>
    {imageId !== null ? (
      <ImageById imageId={imageId} />
    ) : (
      <UserSquareIcon className='encounter-entity-image-icon' />
    )}
  </ImagePlaceholderFrame>
);
