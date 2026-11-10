import { FCProps } from '@/types/fcProps.type';
import {
  EntityPlaceholderIcon,
  type ImagePlaceholderEntityType,
} from '../../../../../EntityPlaceholderIcon';
import { ImageById } from '../../../../../ImageById/ImageById';
import { ImagePlaceholderFrame } from '../../../../../ImagePlaceholderFrame/ImagePlaceholderFrame';
import './CoverCell.css';

type Props = {
  imageId: string;
  entityType: ImagePlaceholderEntityType | null;
};

export const CoverCell: FCProps<Props> = ({ imageId, entityType }) => {
  const dimensions = { width: 100, height: 100 };

  return (
    <ImagePlaceholderFrame className='cover-cell' dimensions={dimensions}>
      {imageId ? (
        <ImageById imageId={imageId} />
      ) : (
        <EntityPlaceholderIcon
          entityType={entityType}
          className='cover-cell--icon'
        />
      )}
    </ImagePlaceholderFrame>
  );
};
