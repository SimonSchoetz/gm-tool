import { useNavigate, useParams } from '@tanstack/react-router';
import { buildEntityPath } from '@domain';
import { Button } from '@/components';
import { useNpc } from '@/data-access-layer';
import { FCProps } from '@/types';

type Props = { label: string };

export const NpcDuplicateBtn: FCProps<Props> = ({ label }) => {
  const navigate = useNavigate();
  const { adventureId, npcId } = useParams({
    from: '/adventure/$adventureId/npc/$npcId',
  });
  const { duplicateNpc } = useNpc(npcId, adventureId);

  const handleDuplicate = async () => {
    const newId = await duplicateNpc();
    await navigate({
      to: buildEntityPath('npcs', newId, adventureId),
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
