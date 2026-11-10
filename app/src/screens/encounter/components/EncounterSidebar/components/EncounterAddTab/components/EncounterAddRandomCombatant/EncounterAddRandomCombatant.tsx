import { useState } from 'react';
import { useParams } from '@tanstack/react-router';
import { normalizeQueueItemName, parseRandomCombatantHp } from '@domain';
import { Input } from '@/components/Input/Input';
import { useEncounterQueueItems } from '@/data-access-layer';
import { FCProps } from '@/types/fcProps.type';
import { EncounterAddBtn } from '../EncounterAddBtn/EncounterAddBtn';
import './EncounterAddRandomCombatant.css';

type Props = { hidden: boolean };

export const EncounterAddRandomCombatant: FCProps<Props> = ({ hidden }) => {
  const { encounterId } = useParams({
    from: '/adventure/$adventureId/encounter/$encounterId',
  });
  const { addRandomCombatant, isAdding } = useEncounterQueueItems(encounterId);
  const [name, setName] = useState('');
  const [hpText, setHpText] = useState('');
  const parsedHp = parseRandomCombatantHp(hpText);
  const canAdd =
    normalizeQueueItemName(name) !== null && parsedHp.valid && !isAdding;

  const handleAdd = async () => {
    // The Add button is disabled and Enter is guarded by `canAdd`, so a call never reaches this guard in an invalid state.
    if (!parsedHp.valid) return;
    const wasAdded = await addRandomCombatant(name, parsedHp.hp);
    if (!wasAdded) return;
    setName('');
    setHpText('');
  };

  const addOnEnter = (event: React.KeyboardEvent) => {
    if (event.key === 'Enter' && canAdd) void handleAdd();
  };

  const onNameChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setName(event.currentTarget.value);
  };

  const onHpChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setHpText(event.currentTarget.value);
  };

  const onAdd = () => {
    void handleAdd();
  };

  return (
    <div className='encounter-add-random-combatant' hidden={hidden}>
      <Input
        aria-label='Combatant name to add'
        placeholder='Name'
        value={name}
        onChange={onNameChange}
        onKeyDown={addOnEnter}
      />

      <div className='encounter-add-random-combatant-row'>
        <Input
          className='encounter-add-random-combatant-hp'
          inputMode='numeric'
          aria-label='HP'
          placeholder='HP'
          value={hpText}
          onChange={onHpChange}
          onKeyDown={addOnEnter}
        />
        <EncounterAddBtn disabled={!canAdd} onAdd={onAdd} />
      </div>
    </div>
  );
};
