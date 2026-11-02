import {
  EntityPlaceholderIcon,
  type ImagePlaceholderEntityType,
} from '../../../../../EntityPlaceholderIcon';
import { ImageById } from '../../../../../ImageById/ImageById';
import { ImagePlaceholderFrame } from '../../../../../ImagePlaceholderFrame/ImagePlaceholderFrame';
import './CoverCell.css';

type CoverCellProps = {
  imageId: string;
  entityType: ImagePlaceholderEntityType | null;
};

export const CoverCell = ({ imageId, entityType }: CoverCellProps) => (
  <ImagePlaceholderFrame
    className='cover-cell'
    dimensions={{ width: 100, height: 100 }}
  >
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
