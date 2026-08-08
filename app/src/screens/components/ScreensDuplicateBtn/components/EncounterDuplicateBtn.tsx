import { useNavigate, useParams } from '@tanstack/react-router';
import { buildEntityPath } from '@domain';
import { Button } from '@/components';
import { useEncounter } from '@/data-access-layer';
import { FCProps } from '@/types';

type Props = { label: string };

export const EncounterDuplicateBtn: FCProps<Props> = ({ label }) => {
  const navigate = useNavigate();
  const { adventureId, encounterId } = useParams({
    from: '/adventure/$adventureId/encounter/$encounterId',
  });
  const { duplicateEncounter } = useEncounter(encounterId, adventureId);

  const handleDuplicate = async () => {
    const newId = await duplicateEncounter();
    await navigate({
      to: buildEntityPath('encounters', newId, adventureId),
      state: { focusNameInput: true },
    });
  };

  return (
    <Button
      label={label}
      onClick={() => {
        void handleDuplicate();
      }}
    />
  );
};
