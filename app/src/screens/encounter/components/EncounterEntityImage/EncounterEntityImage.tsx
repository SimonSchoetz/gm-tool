import type { BaseEntityType } from '@domain';
import { EntityPlaceholderIcon } from '@/components/EntityPlaceholderIcon';
import { ImageById } from '@/components/ImageById/ImageById';
import { ImagePlaceholderFrame } from '@/components/ImagePlaceholderFrame/ImagePlaceholderFrame';
import { FCProps } from '@/types/fcProps.type';
import './EncounterEntityImage.css';

type Props = {
  imageId: string | null;
  entityType: BaseEntityType | null;
  size: number;
};

export const EncounterEntityImage: FCProps<Props> = ({
  imageId,
  entityType,
  size,
}) => {
  const dimensions = { width: size, height: size };

  return (
    <ImagePlaceholderFrame
      className='encounter-entity-image'
      dimensions={dimensions}
    >
      {imageId !== null ? (
        <ImageById imageId={imageId} />
      ) : (
        <EntityPlaceholderIcon
          entityType={entityType}
          className='encounter-entity-image-icon'
        />
      )}
    </ImagePlaceholderFrame>
  );
};
