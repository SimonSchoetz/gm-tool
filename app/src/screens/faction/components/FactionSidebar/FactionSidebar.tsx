import { UploadImgBtn, Button } from '@/components';
import { useFaction } from '@/data-access-layer';
import { useDeleteDialog } from '@/providers';
import { PREVIEW_HEIGHT, PREVIEW_WIDTH } from '@/screens/screens.constants';
import { useRouter, useParams } from '@tanstack/react-router';
import './FactionSidebar.css';

export const FactionSidebar = () => {
  const router = useRouter();
  const { adventureId, factionId } = useParams({
    from: '/adventure/$adventureId/faction/$factionId',
  });
  const { faction, updateFaction, deleteFaction, removeFactionImage } =
    useFaction(factionId, adventureId);
  const { openDeleteDialog } = useDeleteDialog();

  if (!faction) return null;

  const handleFactionDelete = async () => {
    await deleteFaction();
    void router.navigate({ to: `/adventure/${adventureId}/factions` });
  };

  return (
    <aside className='faction-sidebar'>
      <UploadImgBtn
        dimensions={{ width: PREVIEW_WIDTH, height: PREVIEW_HEIGHT }}
        image_id={faction.image_id ?? null}
        title={faction.name ?? ''}
        uploadFn={(filePath) => {
          updateFaction({ imgFilePath: filePath, image_id: faction.image_id });
        }}
        deleteFn={() => {
          if (faction.image_id) void removeFactionImage();
        }}
      />

      <Button
        label='Delete Faction'
        onClick={() => {
          openDeleteDialog({
            name: faction.name ?? '',
            onDeletionConfirm: () => {
              void handleFactionDelete();
            },
            oneClickConfirm: false,
          });
        }}
        buttonStyle={'danger'}
      />
    </aside>
  );
};
