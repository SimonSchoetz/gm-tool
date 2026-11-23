import { buildEntityPath } from '@domain';
import { useEncounter } from '@/data-access-layer';
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

export const EncounterActionRows: FCProps<Props> = ({
  entityId,
  adventureId,
  afterDelete,
  onChoose,
}) => {
  const { encounter, deleteEncounter, duplicateEncounter } = useEncounter(
    entityId,
    adventureId,
  );

  const duplicate = async () =>
    buildEntityPath('encounters', await duplicateEncounter(), adventureId);

  return (
    <EntityActionRows
      name={encounter?.name ?? ''}
      listPath={`/adventure/${adventureId}/encounters`}
      afterDelete={afterDelete}
      onChoose={onChoose}
      duplicate={duplicate}
      deleteEntity={deleteEncounter}
    />
  );
};
