import { UploadImgBtn } from '@/components/UploadImgBtn';
import { Button } from '@/components/Button/Button';
import { useBaseEntity } from '@/data-access-layer';
import { useDeleteDialog } from '@/providers/DeleteDialogProvider';
import {
  buildBaseEntityListPath,
  entityTypeLabel,
  type BaseEntityType,
} from '@domain';
import { FCProps } from '@/types/fcProps.type';
import { PREVIEW_DIMENSIONS } from '../../../screens.constants';
import { useRouter, useParams } from '@tanstack/react-router';
import { ScreensDuplicateBtn } from '../../../components/ScreensDuplicateBtn';
import { ScreensSidebar } from '../../../components/ScreensSidebar/ScreensSidebar';

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

  const onUpload = (filePath: string) => {
    updateBaseEntity({
      imgFilePath: filePath,
      image_id: baseEntity.image_id,
    });
  };

  const onImageDelete = () => {
    if (baseEntity.image_id) void removeBaseEntityImage();
  };

  const onDeleteClick = () => {
    openDeleteDialog({
      name: baseEntity.name ?? '',
      onDeletionConfirm: () => {
        void handleBaseEntityDelete();
      },
      oneClickConfirm: false,
    });
  };

  return (
    <ScreensSidebar>
      <UploadImgBtn
        dimensions={PREVIEW_DIMENSIONS}
        image_id={baseEntity.image_id}
        title=''
        uploadFn={onUpload}
        deleteFn={onImageDelete}
      />

      <ScreensDuplicateBtn entityType={entityType} />

      <Button
        label={`Delete ${entityTypeLabel(entityType)}`}
        onClick={onDeleteClick}
        buttonStyle={'danger'}
      />
    </ScreensSidebar>
  );
};
