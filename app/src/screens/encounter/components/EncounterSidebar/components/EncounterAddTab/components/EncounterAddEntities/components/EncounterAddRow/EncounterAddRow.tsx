import { useParams } from '@tanstack/react-router';
import type { BaseEntity } from '@db/base-entity';
import { UNNAMED_ENTITY_LABEL, entityTypeLabel } from '@domain';
import { Button } from '@/components/Button/Button';
import { useEncounterQueueItems } from '@/data-access-layer';
import { FCProps } from '@/types/fcProps.type';
import { EncounterEntityImage } from '../../../../../../../EncounterEntityImage/EncounterEntityImage';
import './EncounterAddRow.css';

type Props = {
  baseEntity: BaseEntity;
};

export const EncounterAddRow: FCProps<Props> = ({ baseEntity }) => {
  const { encounterId } = useParams({
    from: '/adventure/$adventureId/encounter/$encounterId',
  });
  const { addEntityCombatants, isAdding } = useEncounterQueueItems(encounterId);

  return (
    <li className='encounter-add-row'>
      <EncounterEntityImage
        imageId={baseEntity.image_id}
        entityType={baseEntity.entity_type}
        size={48}
      />

      <div className='encounter-add-row-text'>
        <div className='clip-text'>
          {baseEntity.name ?? UNNAMED_ENTITY_LABEL}
        </div>
        <div className='encounter-add-row-type'>
          {entityTypeLabel(baseEntity.entity_type)}
        </div>
      </div>

      <Button
        label='Add'
        disabled={isAdding}
        onClick={() => {
          void addEntityCombatants(baseEntity.entity_type, baseEntity.id);
        }}
      />
    </li>
  );
};
