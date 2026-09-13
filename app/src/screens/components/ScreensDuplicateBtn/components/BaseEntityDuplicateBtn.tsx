import { useNavigate, useParams } from '@tanstack/react-router';
import { buildEntityPath, type BaseEntityType } from '@domain';
import { Button } from '@/components';
import { useBaseEntity } from '@/data-access-layer';
import { FCProps } from '@/types';

type Props = { entityType: BaseEntityType; label: string };

export const BaseEntityDuplicateBtn: FCProps<Props> = ({
  entityType,
  label,
}) => {
  const navigate = useNavigate();
  const params = useParams({ strict: false });
  const adventureId = params.adventureId ?? '';
  const { duplicateBaseEntity } = useBaseEntity(
    entityType,
    params.baseEntityId ?? '',
    adventureId,
  );

  const handleDuplicate = async () => {
    const newId = await duplicateBaseEntity();
    await navigate({
      to: buildEntityPath(entityType, newId, adventureId),
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
