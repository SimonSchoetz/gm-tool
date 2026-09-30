import { useRouter, useParams } from '@tanstack/react-router';
import { Button } from '@/components/Button/Button';
import { useEncounter } from '@/data-access-layer';
import { useDeleteDialog } from '@/providers/DeleteDialogProvider';
import { ScreensDuplicateBtn } from '../../components/ScreensDuplicateBtn';
import { ScreensSidebar } from '../../components/ScreensSidebar/ScreensSidebar';

export const EncounterSidebar = () => {
  const router = useRouter();
  const { adventureId, encounterId } = useParams({
    from: '/adventure/$adventureId/encounter/$encounterId',
  });
  const { encounter, deleteEncounter } = useEncounter(encounterId, adventureId);
  const { openDeleteDialog } = useDeleteDialog();

  if (!encounter) return;

  const handleEncounterDelete = async () => {
    await deleteEncounter();
    void router.navigate({ to: `/adventure/${adventureId}/encounters` });
  };

  return (
    <ScreensSidebar>
      <ScreensDuplicateBtn entityType='encounters' />

      <Button
        label='Delete Encounter'
        onClick={() => {
          openDeleteDialog({
            name: encounter.name ?? '',
            onDeletionConfirm: () => {
              void handleEncounterDelete();
            },
            oneClickConfirm: false,
          });
        }}
        buttonStyle={'danger'}
      />
    </ScreensSidebar>
  );
};
