import { UploadImgBtn } from '@/components/UploadImgBtn';
import { useBaseEntity } from '@/data-access-layer';
import type { BaseEntityType } from '@domain';
import { FCProps } from '@/types/fcProps.type';
import { PREVIEW_DIMENSIONS } from '../../../screens.constants';
import { useParams } from '@tanstack/react-router';
import { ScreensSidebar } from '../../../components/ScreensSidebar/ScreensSidebar';

type Props = { entityType: BaseEntityType };

export const BaseEntitySidebar: FCProps<Props> = ({ entityType }) => {
  const params = useParams({ strict: false });
  const adventureId = params.adventureId ?? '';
  const { baseEntity, updateBaseEntity, removeBaseEntityImage } = useBaseEntity(
    entityType,
    params.baseEntityId ?? '',
    adventureId,
  );

  if (!baseEntity) return;

  const onUpload = (filePath: string) => {
    updateBaseEntity({
      imgFilePath: filePath,
      image_id: baseEntity.image_id,
    });
  };

  const onImageDelete = () => {
    if (baseEntity.image_id) void removeBaseEntityImage();
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
    </ScreensSidebar>
  );
};
