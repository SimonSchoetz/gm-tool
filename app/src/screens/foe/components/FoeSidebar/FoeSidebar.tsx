import { UploadImgBtn, Button } from '@/components';
import { useFoe } from '@/data-access-layer';
import { useDeleteDialog } from '@/providers';
import { PREVIEW_HEIGHT, PREVIEW_WIDTH } from '@/screens/screens.constants';
import { useRouter, useParams } from '@tanstack/react-router';
import './FoeSidebar.css';

export const FoeSidebar = () => {
  const router = useRouter();
  const { adventureId, foeId } = useParams({
    from: '/adventure/$adventureId/foe/$foeId',
  });
  const { foe, updateFoe, deleteFoe, removeFoeImage } = useFoe(
    foeId,
    adventureId,
  );
  const { openDeleteDialog } = useDeleteDialog();

  if (!foe) return null;

  const handleFoeDelete = async () => {
    await deleteFoe();
    void router.navigate({ to: `/adventure/${adventureId}/foes` });
  };

  return (
    <aside className='foe-sidebar'>
      <UploadImgBtn
        dimensions={{ width: PREVIEW_WIDTH, height: PREVIEW_HEIGHT }}
        image_id={foe.image_id ?? null}
        title=''
        uploadFn={(filePath) => {
          updateFoe({ imgFilePath: filePath, image_id: foe.image_id });
        }}
        deleteFn={() => {
          if (foe.image_id) void removeFoeImage();
        }}
      />

      <Button
        label='Delete Foe'
        onClick={() => {
          openDeleteDialog({
            name: foe.name ?? '',
            onDeletionConfirm: () => {
              void handleFoeDelete();
            },
            oneClickConfirm: false,
          });
        }}
        buttonStyle={'danger'}
      />
    </aside>
  );
};
