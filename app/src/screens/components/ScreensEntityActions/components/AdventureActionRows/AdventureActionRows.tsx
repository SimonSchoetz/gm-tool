import { useAdventure } from '@/data-access-layer';
import { FCProps } from '@/types/fcProps.type';
import {
  EntityActionRows,
  type AfterDelete,
} from '../EntityActionRows/EntityActionRows';

type Props = {
  entityId: string;
  afterDelete: AfterDelete;
  onChoose: () => void;
};

// No `duplicate`: an adventure owns seven child tables, and duplicating it is out of scope.
export const AdventureActionRows: FCProps<Props> = ({
  entityId,
  afterDelete,
  onChoose,
}) => {
  const { adventure, deleteAdventure } = useAdventure(entityId);

  return (
    <EntityActionRows
      entityType='adventures'
      adventureId={entityId}
      name={adventure?.name ?? ''}
      listPath='/adventures'
      afterDelete={afterDelete}
      onChoose={onChoose}
      deleteEntity={deleteAdventure}
    />
  );
};
