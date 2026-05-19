import { UploadImgBtn, Button } from '@/components';
import { useAdventure } from '@/data-access-layer';
import { useDeleteDialog } from '@/providers';
import { useRouter, useParams } from '@tanstack/react-router';
import './AdventureScreenSidebar.css';
import {
  ADVENTURE_PREVIEW_HEIGHT,
  ADVENTURE_PREVIEW_WIDTH,
} from '../../../screens.constants';

export const AdventureScreenSidebar = () => {
  const router = useRouter();
  const { adventureId } = useParams({
    from: '/adventure/$adventureId/',
  });

  const { adventure, updateAdventure, deleteAdventure, removeAdventureImage } =
    useAdventure(adventureId);

  const { openDeleteDialog } = useDeleteDialog();

  if (!adventure) return null;

  const handleAdventureDelete = async () => {
    await deleteAdventure();
    void router.navigate({ to: '/adventures' });
  };
  return (
    <aside className='adventure-sidebar'>
      <UploadImgBtn
        dimensions={{
          width: ADVENTURE_PREVIEW_WIDTH,
          height: ADVENTURE_PREVIEW_HEIGHT,
        }}
        image_id={adventure.image_id ?? null}
        uploadFn={(filePath) => {
          updateAdventure({
            imgFilePath: filePath,
            image_id: adventure.image_id,
          });
        }}
        deleteFn={() => {
          if (adventure.image_id) void removeAdventureImage();
        }}
      />
      <Button
        label='Delete Adventure'
        onClick={() => {
          openDeleteDialog({
            name: adventure.name ?? '',
            onDeletionConfirm: () => {
              void handleAdventureDelete();
            },
            oneClickConfirm: false,
          });
        }}
        buttonStyle={'danger'}
      />
    </aside>
  );
};
