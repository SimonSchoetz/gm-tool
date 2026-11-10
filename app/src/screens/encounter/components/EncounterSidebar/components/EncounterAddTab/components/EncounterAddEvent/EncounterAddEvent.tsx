import { useState } from 'react';
import { useParams } from '@tanstack/react-router';
import { normalizeQueueItemName } from '@domain';
import { Input } from '@/components/Input/Input';
import { useEncounterQueueItems } from '@/data-access-layer';
import { FCProps } from '@/types/fcProps.type';
import { EncounterAddBtn } from '../EncounterAddBtn/EncounterAddBtn';
import './EncounterAddEvent.css';

type Props = { hidden: boolean };

export const EncounterAddEvent: FCProps<Props> = ({ hidden }) => {
  const { encounterId } = useParams({
    from: '/adventure/$adventureId/encounter/$encounterId',
  });
  const { addEvent, isAdding } = useEncounterQueueItems(encounterId);
  const [name, setName] = useState('');
  const canAdd = normalizeQueueItemName(name) !== null && !isAdding;

  const handleAdd = async () => {
    const wasAdded = await addEvent(name);
    if (!wasAdded) return;
    setName('');
  };

  const onNameChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setName(event.currentTarget.value);
  };

  const onNameKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Enter' && canAdd) void handleAdd();
  };

  const onAdd = () => {
    void handleAdd();
  };

  return (
    <div className='encounter-add-event' hidden={hidden}>
      <Input
        className='encounter-add-event-name'
        aria-label='Event name to add'
        placeholder='Name'
        value={name}
        onChange={onNameChange}
        onKeyDown={onNameKeyDown}
      />
      <EncounterAddBtn disabled={!canAdd} onAdd={onAdd} />
    </div>
  );
};
