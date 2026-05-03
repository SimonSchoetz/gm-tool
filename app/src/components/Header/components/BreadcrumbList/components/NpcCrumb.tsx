import { Link, useParams } from '@tanstack/react-router';
import { useNpc } from '@/data-access-layer';
import { FCProps } from '@/types';

type Props = object;

export const NpcCrumb: FCProps<Props> = () => {
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
