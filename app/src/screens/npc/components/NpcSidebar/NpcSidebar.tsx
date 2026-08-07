import { UploadImgBtn, Button } from '@/components';
import { useNpc } from '@/data-access-layer';
import { useDeleteDialog } from '@/providers';
import { PREVIEW_HEIGHT, PREVIEW_WIDTH } from '../../../screens.constants';
import { useRouter, useParams } from '@tanstack/react-router';
import { ScreensDuplicateBtn, ScreensSidebar } from '../../../components';

export const NpcSidebar = () => {
  const router = useRouter();
  const { adventureId, npcId } = useParams({
    from: '/adventure/$adventureId/npc/$npcId',
  });
  const { npc, updateNpc, deleteNpc, removeNpcImage } = useNpc(
    npcId,
    adventureId,
  );
  const { openDeleteDialog } = useDeleteDialog();

  if (!npc) return;

  const handleNpcDelete = async () => {
    await deleteNpc();
    void router.navigate({ to: `/adventure/${adventureId}/npcs` });
  };

  return (
    <ScreensSidebar>
      <UploadImgBtn
        dimensions={{ width: PREVIEW_WIDTH, height: PREVIEW_HEIGHT }}
        image_id={npc.image_id ?? null}
        title=''
        uploadFn={(filePath) => {
          updateNpc({ imgFilePath: filePath, image_id: npc.image_id });
        }}
        deleteFn={() => {
          if (npc.image_id) void removeNpcImage();
        }}
      />

      <ScreensDuplicateBtn entityType='npcs' />

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
    </ScreensSidebar>
  );
};
