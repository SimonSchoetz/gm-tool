import { FCProps } from '@/types/fcProps.type';
import {
  EntityPlaceholderIcon,
  type ImagePlaceholderEntityType,
} from '../../../../../EntityPlaceholderIcon';
import { ImageById } from '../../../../../ImageById';
import { ImagePlaceholderFrame } from '../../../../../ImagePlaceholderFrame/ImagePlaceholderFrame';
import './CoverCell.css';

type Props = {
  imageId: string;
  entityType: ImagePlaceholderEntityType | null;
};

const COVER_DIMENSIONS = { width: 100, height: 100 };

export const CoverCell: FCProps<Props> = ({ imageId, entityType }) => {
  return (
    <ImagePlaceholderFrame className='cover-cell' dimensions={COVER_DIMENSIONS}>
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
