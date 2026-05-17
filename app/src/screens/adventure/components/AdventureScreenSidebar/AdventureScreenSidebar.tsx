import { UploadImgBtn, Button } from '@/components';
import { useAdventure, useImageMutations } from '@/data-access-layer';
import { useDeleteDialog } from '@/providers';
import { useRouter, useParams } from '@tanstack/react-router';
import './AdventureScreenSidebar.css';

export const AdventureScreenSidebar = () => {
  const router = useRouter();
  const { adventureId } = useParams({
    from: '/adventure/$adventureId/',
  });

  const { adventure, updateAdventure, deleteAdventure, loading } =
    useAdventure(adventureId);

  const { openDeleteDialog } = useDeleteDialog();
  const { deleteImage } = useImageMutations();

  if (loading || !adventure) {
    return <div>Loading...</div>;
  }

  const handleAdventureDelete = async () => {
    await deleteAdventure();
    void router.navigate({ to: '/adventures' });
  };
  return (
    <aside className='adventure-sidebar'>
      <UploadImgBtn
        dimensions={{ width: 200, height: 350 }}
        image_id={adventure.image_id ?? null}
        uploadFn={(filePath) => {
          updateAdventure({
            imgFilePath: filePath,
            image_id: adventure.image_id,
          });
        }}
        deleteFn={() => {
          if (adventure.image_id) {
            void deleteImage(adventure.image_id);
            updateAdventure({ image_id: null });
          }
        }}
      />
      <Button
        label='Delete Adventure'
        onClick={() => {
          openDeleteDialog({
            name: adventure.name,
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
