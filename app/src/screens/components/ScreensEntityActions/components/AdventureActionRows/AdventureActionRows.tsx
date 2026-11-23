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

// No `duplicate`: adventures cannot be duplicated.
export const AdventureActionRows: FCProps<Props> = ({
  entityId,
  afterDelete,
  onChoose,
}) => {
  const { adventure, deleteAdventure } = useAdventure(entityId);

  return (
    <EntityActionRows
      name={adventure?.name ?? ''}
      listPath='/adventures'
      afterDelete={afterDelete}
      onChoose={onChoose}
      deleteEntity={deleteAdventure}
    />
  );
};
