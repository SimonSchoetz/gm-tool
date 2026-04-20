import { UserSquareIcon } from 'lucide-react';
import { ImageById, ImagePlaceholderFrame } from '@/components';

type AvatarCellProps = {
  imageId: string;
};

export const AvatarCell = ({ imageId }: AvatarCellProps) => (
  <ImagePlaceholderFrame dimensions={{ width: '100px', height: '100px' }}>
    {imageId ? (
      <ImageById imageId={imageId} className='sortable-list-item__avatar-img' />
    ) : (
      <UserSquareIcon className='sortable-list-item__avatar-icon' />
    )}
  </ImagePlaceholderFrame>
);
