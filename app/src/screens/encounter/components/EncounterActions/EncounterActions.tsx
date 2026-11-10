import { useRouter, useParams } from '@tanstack/react-router';
import { Button } from '@/components/Button/Button';
import { Checkbox } from '@/components/Checkbox/Checkbox';
import { useEncounter } from '@/data-access-layer';
import { useDeleteDialog } from '@/providers/DeleteDialogProvider';
import { ScreensDuplicateBtn } from '../../../components/ScreensDuplicateBtn';
import './EncounterActions.css';

export const EncounterActions = () => {
  const router = useRouter();
  const { adventureId, encounterId } = useParams({
    from: '/adventure/$adventureId/encounter/$encounterId',
  });
  const { encounter, updateEncounter, deleteEncounter } = useEncounter(
    encounterId,
    adventureId,
  );
  const { openDeleteDialog } = useDeleteDialog();

  if (!encounter) return;

  const handleEncounterDelete = async () => {
    await deleteEncounter();
    void router.navigate({ to: `/adventure/${adventureId}/encounters` });
  };

  const onHideDefeatedChange = () => {
    updateEncounter({
      hide_defeated: encounter.hide_defeated === 1 ? 0 : 1,
    });
  };

  const onDeleteClick = () => {
    openDeleteDialog({
      name: encounter.name ?? '',
      onDeletionConfirm: () => {
        void handleEncounterDelete();
      },
      oneClickConfirm: false,
    });
  };

  return (
    <>
      <div className='encounter-actions-hide-defeated'>
        <Checkbox
          id='encounter-hide-defeated'
          checked={encounter.hide_defeated === 1}
          onChange={onHideDefeatedChange}
        />
        <label htmlFor='encounter-hide-defeated'>Hide defeated</label>
      </div>

      <ScreensDuplicateBtn entityType='encounters' />

      <Button
        label='Delete Encounter'
        onClick={onDeleteClick}
        buttonStyle={'danger'}
      />
    </>
  );
};
