import { buildEntityPath } from '@domain';
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

  const duplicate = async () =>
    buildEntityPath('sessions', await duplicateSession(), adventureId);

  return (
    <EntityActionRows
      name={session?.name ?? ''}
      listPath={`/adventure/${adventureId}/sessions`}
      afterDelete={afterDelete}
      onChoose={onChoose}
      duplicate={duplicate}
      deleteEntity={deleteSession}
    />
  );
};
