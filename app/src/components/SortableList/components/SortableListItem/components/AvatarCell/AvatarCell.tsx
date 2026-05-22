import { UserSquareIcon } from 'lucide-react';
import { ImageById, ImagePlaceholderFrame } from '@/components';
import './AvatarCell.css';

type AvatarCellProps = {
  imageId: string;
};

export const AvatarCell = ({ imageId }: AvatarCellProps) => (
  <ImagePlaceholderFrame
    className='avatar-cell'
    dimensions={{ width: 100, height: 100 }}
  >
    {imageId ? (
      <ImageById imageId={imageId} />
    ) : (
      <UserSquareIcon className='avatar-cell--icon' />
    )}
  </ImagePlaceholderFrame>
);
