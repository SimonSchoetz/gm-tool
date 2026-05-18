import { UploadImgBtn, Button } from '@/components';
import { useNpc, useImageMutations } from '@/data-access-layer';
import { useDeleteDialog } from '@/providers';
import { PREVIEW_HEIGHT, PREVIEW_WIDTH } from '@/screens/screens.constants';
import { useRouter, useParams } from '@tanstack/react-router';
import './NpcSidebar.css';

export const NpcSidebar = () => {
  const router = useRouter();
  const { adventureId, npcId } = useParams({
    from: '/adventure/$adventureId/npc/$npcId',
  });
  const { npc, updateNpc, deleteNpc } = useNpc(npcId, adventureId);
  const { openDeleteDialog } = useDeleteDialog();
  const { deleteImage } = useImageMutations();

  if (!npc) return;

  const handleNpcDelete = async () => {
    await deleteNpc();
    void router.navigate({ to: `/adventure/${adventureId}/npcs` });
  };

  return (
    <aside className='npc-sidebar'>
      <UploadImgBtn
        dimensions={{ width: PREVIEW_WIDTH, height: PREVIEW_HEIGHT }}
        image_id={npc.image_id ?? null}
        title={npc.name ?? ''}
        uploadFn={(filePath) => {
          updateNpc({ imgFilePath: filePath, image_id: npc.image_id });
        }}
        deleteFn={() => {
          if (npc.image_id) {
            void deleteImage(npc.image_id);
            updateNpc({ image_id: null });
          }
        }}
      />

      <Button
        label='Delete NPC'
        onClick={() => {
          openDeleteDialog({
            name: npc.name ?? '',
            onDeletionConfirm: () => {
              void handleNpcDelete();
            },
            oneClickConfirm: false,
          });
        }}
        buttonStyle={'danger'}
      />
    </aside>
  );
};
