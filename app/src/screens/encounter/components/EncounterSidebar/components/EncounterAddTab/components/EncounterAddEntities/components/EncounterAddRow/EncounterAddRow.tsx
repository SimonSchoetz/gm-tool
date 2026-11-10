import { useParams } from '@tanstack/react-router';
import type { BaseEntity } from '@db/base-entity';
import { UNNAMED_ENTITY_LABEL, entityTypeLabel } from '@domain';
import { useEncounterQueueItems } from '@/data-access-layer';
import { FCProps } from '@/types/fcProps.type';
import { EncounterEntityImage } from '../../../../../../../EncounterEntityImage/EncounterEntityImage';
import { EncounterAddBtn } from '../../../EncounterAddBtn/EncounterAddBtn';
import './EncounterAddRow.css';

type Props = {
  baseEntity: BaseEntity;
};

export const EncounterAddRow: FCProps<Props> = ({ baseEntity }) => {
  const { encounterId } = useParams({
    from: '/adventure/$adventureId/encounter/$encounterId',
  });
  const { addEntityCombatant, isAdding } = useEncounterQueueItems(encounterId);

  const onAdd = () => {
    void addEntityCombatant(baseEntity.entity_type, baseEntity.id);
  };

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

      <EncounterAddBtn disabled={isAdding} onAdd={onAdd} />
    </li>
  );
};
