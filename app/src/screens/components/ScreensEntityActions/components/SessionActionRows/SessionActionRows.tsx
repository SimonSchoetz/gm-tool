import { useSession } from '@/data-access-layer';
import { FCProps } from '@/types/fcProps.type';
import {
  EntityActionRows,
  type AfterDelete,
} from '../EntityActionRows/EntityActionRows';

type Props = {
  entityId: string;
  adventureId: string;
  afterDelete: AfterDelete;
  onChoose: () => void;
};

export const SessionActionRows: FCProps<Props> = ({
  entityId,
  adventureId,
  afterDelete,
  onChoose,
}) => {
  const { session, deleteSession, duplicateSession } = useSession(
    entityId,
    adventureId,
  );

  return (
    <EntityActionRows
      entityType='sessions'
      adventureId={adventureId}
      name={session?.name ?? ''}
      listPath={`/adventure/${adventureId}/sessions`}
      canDelete={session !== null}
      afterDelete={afterDelete}
      onChoose={onChoose}
      duplicate={duplicateSession}
      deleteEntity={deleteSession}
    />
  );
};
