import { useParams } from '@tanstack/react-router';
import type { BaseEntity } from '@db/base-entity';
import { UNNAMED_ENTITY_LABEL, entityTypeLabel } from '@domain';
import { Button } from '@/components/Button/Button';
import { useEncounterQueueItems } from '@/data-access-layer';
import { FCProps } from '@/types/fcProps.type';
import { EncounterEntityImage } from '../../../../../../../EncounterEntityImage/EncounterEntityImage';
import { EncounterQuantityInput } from '../../../EncounterQuantityInput/EncounterQuantityInput';
import { useAddQuantity } from '../../../../hooks/useAddQuantity';
import './EncounterAddRow.css';

type Props = {
  baseEntity: BaseEntity;
};

export const EncounterAddRow: FCProps<Props> = ({ baseEntity }) => {
  const { encounterId } = useParams({
    from: '/adventure/$adventureId/encounter/$encounterId',
  });
  const { addEntityCombatants, isAdding } = useEncounterQueueItems(encounterId);
  const {
    quantity,
    quantityText,
    changeQuantityText,
    revertQuantityText,
    reset,
  } = useAddQuantity();

  const handleAdd = async () => {
    // Stryker disable next-line ConditionalExpression: the Add button is disabled while the quantity is null, so a click never reaches this guard
    if (quantity === null) return;
    const wasAdded = await addEntityCombatants(
      baseEntity.entity_type,
      baseEntity.id,
      quantity,
    );
    if (!wasAdded) return;
    reset();
  };

  return (
    <li className='encounter-add-row'>
      <EncounterEntityImage imageId={baseEntity.image_id} size={48} />

      <div className='encounter-add-row-text'>
        <div className='clip-text'>
          {baseEntity.name ?? UNNAMED_ENTITY_LABEL}
        </div>
        <div className='encounter-add-row-type'>
          {entityTypeLabel(baseEntity.entity_type)}
        </div>
      </div>

      <EncounterQuantityInput
        quantityText={quantityText}
        onQuantityTextChange={changeQuantityText}
        onBlur={revertQuantityText}
      />

      <Button
        label='Add'
        disabled={quantity === null || isAdding}
        onClick={() => {
          void handleAdd();
        }}
      />
    </li>
  );
};
