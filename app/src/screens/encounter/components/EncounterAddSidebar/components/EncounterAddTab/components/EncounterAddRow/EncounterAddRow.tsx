import { useState } from 'react';
import { useParams } from '@tanstack/react-router';
import type { BaseEntity } from '@db/base-entity';
import {
  MAX_ADD_QUANTITY,
  MIN_ADD_QUANTITY,
  UNTITLED_COMBATANT_NAME,
  entityTypeLabel,
  parseAddQuantity,
} from '@domain';
import { Button } from '@/components/Button/Button';
import { Input } from '@/components/Input/Input';
import { useEncounterQueueItems } from '@/data-access-layer';
import { FCProps } from '@/types/fcProps.type';
import { EncounterEntityImage } from '../../../../../EncounterEntityImage/EncounterEntityImage';
import './EncounterAddRow.css';

type Props = {
  baseEntity: BaseEntity;
};

export const EncounterAddRow: FCProps<Props> = ({ baseEntity }) => {
  const { encounterId } = useParams({
    from: '/adventure/$adventureId/encounter/$encounterId',
  });
  const { addEntityCombatants, isAdding } = useEncounterQueueItems(encounterId);
  const [quantityText, setQuantityText] = useState('1');
  const [lastValidQuantity, setLastValidQuantity] = useState(1);
  const quantity = parseAddQuantity(quantityText);

  const handleAdd = async () => {
    // Stryker disable next-line ConditionalExpression: the Add button is disabled while the quantity is null, so a click never reaches this guard
    if (quantity === null) return;
    const wasAdded = await addEntityCombatants(
      baseEntity.entity_type,
      baseEntity.id,
      quantity,
    );
    if (!wasAdded) return;
    setQuantityText('1');
    setLastValidQuantity(1);
  };

  return (
    <li className='encounter-add-row'>
      <EncounterEntityImage imageId={baseEntity.image_id} size={48} />

      <div className='encounter-add-row-text'>
        <div className='clip-text'>
          {baseEntity.name ?? UNTITLED_COMBATANT_NAME}
        </div>
        <div className='encounter-add-row-type'>
          {entityTypeLabel(baseEntity.entity_type)}
        </div>
      </div>

      <Input
        className='encounter-add-row-quantity number-input'
        type='number'
        min={MIN_ADD_QUANTITY}
        max={MAX_ADD_QUANTITY}
        aria-label='Quantity'
        value={quantityText}
        onChange={(event) => {
          setQuantityText(event.currentTarget.value);
          const validQuantity = parseAddQuantity(event.currentTarget.value);
          if (validQuantity !== null) setLastValidQuantity(validQuantity);
        }}
        onBlur={() => {
          setQuantityText(String(lastValidQuantity));
        }}
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
