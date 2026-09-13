import { UploadImgBtn, Button } from '@/components';
import { useBaseEntity } from '@/data-access-layer';
import { useDeleteDialog } from '@/providers';
import {
  buildBaseEntityListPath,
  entityTypeLabel,
  type BaseEntityType,
} from '@domain';
import { FCProps } from '@/types';
import { PREVIEW_HEIGHT, PREVIEW_WIDTH } from '../../../screens.constants';
import { useRouter, useParams } from '@tanstack/react-router';
import { ScreensDuplicateBtn, ScreensSidebar } from '../../../components';

type Props = { entityType: BaseEntityType };

export const BaseEntitySidebar: FCProps<Props> = ({ entityType }) => {
  const router = useRouter();
  const params = useParams({ strict: false });
  const adventureId = params.adventureId ?? '';
  const {
    baseEntity,
    updateBaseEntity,
    deleteBaseEntity,
    removeBaseEntityImage,
  } = useBaseEntity(entityType, params.baseEntityId ?? '', adventureId);
  const { openDeleteDialog } = useDeleteDialog();

  if (!baseEntity) return;

  const handleBaseEntityDelete = async () => {
    await deleteBaseEntity();
    void router.navigate({
      to: buildBaseEntityListPath(entityType, adventureId),
    });
  };

  return (
    <ScreensSidebar>
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

      <ScreensDuplicateBtn entityType={entityType} />

      <Button
        label={`Delete ${entityTypeLabel(entityType)}`}
        onClick={() => {
          openDeleteDialog({
            name: baseEntity.name ?? '',
            onDeletionConfirm: () => {
              void handleBaseEntityDelete();
            },
            oneClickConfirm: false,
          });
        }}
        buttonStyle={'danger'}
      />
    </ScreensSidebar>
  );
};
