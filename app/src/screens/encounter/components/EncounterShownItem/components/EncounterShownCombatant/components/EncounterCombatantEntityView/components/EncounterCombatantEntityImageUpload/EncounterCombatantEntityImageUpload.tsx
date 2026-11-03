import { useParams } from '@tanstack/react-router';
import { UploadImgBtn } from '@/components/UploadImgBtn';
import { useBaseEntity } from '@/data-access-layer';
import { FCProps } from '@/types/fcProps.type';
import type { BaseEntityType } from '@domain';
import {
  PREVIEW_HEIGHT,
  PREVIEW_WIDTH,
} from '../../../../../../../../../screens.constants';
import './EncounterCombatantEntityImageUpload.css';

type Props = { entityType: BaseEntityType; entityId: string };

export const EncounterCombatantEntityImageUpload: FCProps<Props> = ({
  entityType,
  entityId,
}) => {
  const { adventureId } = useParams({
    from: '/adventure/$adventureId/encounter/$encounterId',
  });
  const { baseEntity, updateBaseEntity, removeBaseEntityImage } = useBaseEntity(
    entityType,
    entityId,
    adventureId,
  );

  if (baseEntity === null) return;

  return (
    <div className='encounter-combatant-entity-image-upload'>
      <UploadImgBtn
        dimensions={{ width: PREVIEW_WIDTH, height: PREVIEW_HEIGHT }}
        image_id={baseEntity.image_id}
        title=''
        uploadFn={(filePath) => {
          updateBaseEntity({
            imgFilePath: filePath,
            image_id: baseEntity.image_id,
          });
        }}
        deleteFn={() => {
          if (baseEntity.image_id) void removeBaseEntityImage();
        }}
      />
    </div>
  );
};
