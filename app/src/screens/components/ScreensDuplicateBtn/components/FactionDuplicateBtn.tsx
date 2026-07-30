import { useNavigate, useParams } from '@tanstack/react-router';
import { buildEntityPath } from '@domain';
import { Button } from '@/components';
import { useFaction } from '@/data-access-layer';
import { FCProps } from '@/types';

type Props = { label: string };

export const FactionDuplicateBtn: FCProps<Props> = ({ label }) => {
  const navigate = useNavigate();
  const { adventureId, factionId } = useParams({
    from: '/adventure/$adventureId/faction/$factionId',
  });
  const { duplicateFaction } = useFaction(factionId, adventureId);

  const handleDuplicate = async () => {
    const newId = await duplicateFaction();
    await navigate({
      to: buildEntityPath('factions', newId, adventureId),
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
