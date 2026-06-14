import { UploadImgBtn, Button } from '@/components';
import { usePc } from '@/data-access-layer';
import { useDeleteDialog } from '@/providers';
import { PREVIEW_HEIGHT, PREVIEW_WIDTH } from '@/screens/screens.constants';
import { useRouter, useParams } from '@tanstack/react-router';
import './PcSidebar.css';

export const PcSidebar = () => {
  const router = useRouter();
  const { adventureId, pcId } = useParams({
    from: '/adventure/$adventureId/pc/$pcId',
  });
  const { pc, updatePc, deletePc, removePcImage } = usePc(pcId, adventureId);
  const { openDeleteDialog } = useDeleteDialog();

  if (!pc) return null;

  const handlePcDelete = async () => {
    await deletePc();
    void router.navigate({ to: `/adventure/${adventureId}/pcs` });
  };

  return (
    <aside className='pc-sidebar'>
      <UploadImgBtn
        dimensions={{ width: PREVIEW_WIDTH, height: PREVIEW_HEIGHT }}
        image_id={pc.image_id ?? null}
        title=''
        uploadFn={(filePath) => {
          updatePc({ imgFilePath: filePath, image_id: pc.image_id });
        }}
        deleteFn={() => {
          if (pc.image_id) void removePcImage();
        }}
      />

      <Button
        label='Delete PC'
        onClick={() => {
          openDeleteDialog({
            name: pc.name ?? '',
            onDeletionConfirm: () => {
              void handlePcDelete();
            },
            oneClickConfirm: false,
          });
        }}
        buttonStyle={'danger'}
      />
    </aside>
  );
};
