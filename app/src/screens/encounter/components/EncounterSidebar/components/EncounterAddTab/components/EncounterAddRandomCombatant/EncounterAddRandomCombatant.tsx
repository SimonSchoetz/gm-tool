import { useState } from 'react';
import { useParams } from '@tanstack/react-router';
import { normalizeQueueItemName, parseRandomCombatantHp } from '@domain';
import { Button } from '@/components/Button/Button';
import { Input } from '@/components/Input/Input';
import { useEncounterQueueItems } from '@/data-access-layer';
import { FCProps } from '@/types/fcProps.type';
import { EncounterQuantityInput } from '../EncounterQuantityInput/EncounterQuantityInput';
import { useAddQuantity } from '../../hooks/useAddQuantity';
import './EncounterAddRandomCombatant.css';

type Props = { hidden: boolean };

export const EncounterAddRandomCombatant: FCProps<Props> = ({ hidden }) => {
  const { encounterId } = useParams({
    from: '/adventure/$adventureId/encounter/$encounterId',
  });
  const { addRandomCombatants, isAdding } = useEncounterQueueItems(encounterId);
  const [name, setName] = useState('');
  const [hpText, setHpText] = useState('');
  const {
    quantity,
    quantityText,
    changeQuantityText,
    revertQuantityText,
    reset,
  } = useAddQuantity();
  const parsedHp = parseRandomCombatantHp(hpText);
  const canAdd =
    normalizeQueueItemName(name) !== null &&
    parsedHp.valid &&
    quantity !== null &&
    !isAdding;

  const handleAdd = async () => {
    // Stryker disable next-line ConditionalExpression,LogicalOperator: the Add button is disabled and Enter is guarded by canAdd, so a call never reaches this guard in an invalid state
    if (!parsedHp.valid || quantity === null) return;
    const wasAdded = await addRandomCombatants(name, parsedHp.hp, quantity);
    if (!wasAdded) return;
    setName('');
    setHpText('');
    reset();
  };

  const addOnEnter = (event: React.KeyboardEvent) => {
    if (event.key === 'Enter' && canAdd) void handleAdd();
  };

  return (
    <div className='encounter-add-random-combatant' hidden={hidden}>
      <Input
        aria-label='Combatant name to add'
        placeholder='Name'
        value={name}
        onChange={(event) => {
          setName(event.currentTarget.value);
        }}
        onKeyDown={addOnEnter}
      />

      <div className='encounter-add-random-combatant-row'>
        <Input
          className='encounter-add-random-combatant-hp'
          inputMode='numeric'
          aria-label='HP'
          placeholder='HP'
          value={hpText}
          onChange={(event) => {
            setHpText(event.currentTarget.value);
          }}
          onKeyDown={addOnEnter}
        />
        <EncounterQuantityInput
          quantityText={quantityText}
          onQuantityTextChange={changeQuantityText}
          onBlur={revertQuantityText}
          onKeyDown={addOnEnter}
        />
        <Button
          label='Add'
          disabled={!canAdd}
          onClick={() => {
            void handleAdd();
          }}
        />
      </div>
    </div>
  );
};
