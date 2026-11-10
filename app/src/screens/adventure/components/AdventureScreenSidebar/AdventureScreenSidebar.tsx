import { UploadImgBtn } from '@/components/UploadImgBtn';
import { Button } from '@/components/Button/Button';
import { useAdventure } from '@/data-access-layer';
import { useDeleteDialog } from '@/providers/DeleteDialogProvider';
import { useRouter, useParams } from '@tanstack/react-router';
import {
  ADVENTURE_PREVIEW_HEIGHT,
  PREVIEW_WIDTH,
} from '../../../screens.constants';
import { ScreensDuplicateBtn } from '../../../components/ScreensDuplicateBtn';
import { ScreensSidebar } from '../../../components/ScreensSidebar/ScreensSidebar';

export const AdventureScreenSidebar = () => {
  const router = useRouter();
  const { adventureId } = useParams({
    from: '/adventure/$adventureId/',
  });

  const { adventure, updateAdventure, deleteAdventure, removeAdventureImage } =
    useAdventure(adventureId);

  const { openDeleteDialog } = useDeleteDialog();

  if (!adventure) return;

  const handleAdventureDelete = async () => {
    await deleteAdventure();
    void router.navigate({ to: '/adventures' });
  };

  const dimensions = {
    width: PREVIEW_WIDTH,
    height: ADVENTURE_PREVIEW_HEIGHT,
  };

  const onUpload = (filePath: string) => {
    updateAdventure({
      imgFilePath: filePath,
      image_id: adventure.image_id,
    });
  };

  const onImageDelete = () => {
    if (adventure.image_id) void removeAdventureImage();
  };

  const onDeleteClick = () => {
    openDeleteDialog({
      name: adventure.name ?? '',
      onDeletionConfirm: () => {
        void handleAdventureDelete();
      },
      oneClickConfirm: false,
    });
  };

  return (
    <ScreensSidebar>
      <UploadImgBtn
        dimensions={dimensions}
        image_id={adventure.image_id}
        uploadFn={onUpload}
        deleteFn={onImageDelete}
      />
      <ScreensDuplicateBtn entityType='adventures' />

      <Button
        label='Delete Adventure'
        onClick={onDeleteClick}
        buttonStyle={'danger'}
      />
    </ScreensSidebar>
  );
};
