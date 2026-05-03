import { Link, useParams } from '@tanstack/react-router';
import { useNpc } from '@/data-access-layer';

export const NpcCrumb = () => {
  const { adventureId, npcId } = useParams({ strict: false });
  const { npc } = useNpc(npcId ?? '', adventureId ?? '');

  return (
    <Link
      to='/adventure/$adventureId/npc/$npcId'
      params={{ adventureId: adventureId ?? '', npcId: npcId ?? '' }}
    >
      {npc?.name ?? '…'}
    </Link>
  );
};
