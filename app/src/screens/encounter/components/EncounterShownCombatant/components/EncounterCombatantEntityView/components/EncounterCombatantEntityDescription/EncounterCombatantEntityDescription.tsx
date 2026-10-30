import { useParams } from '@tanstack/react-router';
import { TextEditor } from '@/components/TextEditor';
import { useBaseEntity } from '@/data-access-layer';
import { FCProps } from '@/types/fcProps.type';
import type { BaseEntityType } from '@domain';

type Props = { entityType: BaseEntityType; entityId: string };

export const EncounterCombatantEntityDescription: FCProps<Props> = ({
  entityType,
  entityId,
}) => {
  const { adventureId } = useParams({
    from: '/adventure/$adventureId/encounter/$encounterId',
  });
  const { baseEntity, updateBaseEntity } = useBaseEntity(
    entityType,
    entityId,
    adventureId,
  );

  if (baseEntity === null) return;

  return (
    <TextEditor
      value={baseEntity.description ?? ''}
      textEditorId={`ENCOUNTER_SHOWN_ENTITY_${baseEntity.id}_description`}
      onChange={(description) => {
        updateBaseEntity({ description });
      }}
    />
  );
};
