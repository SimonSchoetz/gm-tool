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

  return (
    <EntityActionRows
      entityType='encounters'
      adventureId={adventureId}
      name={encounter?.name ?? ''}
      listPath={`/adventure/${adventureId}/encounters`}
      canDelete={encounter !== null}
      afterDelete={afterDelete}
      onChoose={onChoose}
      duplicate={duplicateEncounter}
      deleteEntity={deleteEncounter}
    />
  );
};
