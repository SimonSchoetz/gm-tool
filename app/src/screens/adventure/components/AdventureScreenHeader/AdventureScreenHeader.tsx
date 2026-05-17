import { Input } from '@/components';
import { useAdventure } from '@/data-access-layer';
import { cn } from '@/util';
import { useParams } from '@tanstack/react-router';
import { getDateTimeString } from '@util';
import { useState } from 'react';
import './AdventureScreenHeader.css';

export const AdventureScreenHeader = () => {
  const { adventureId } = useParams({
    from: '/adventure/$adventureId/',
  });

  const { adventure, updateAdventure } = useAdventure(adventureId);

  const [adventureName, setAdventureName] = useState(adventure?.name ?? '');

  if (!adventure) return;

  const startDate = getDateTimeString(adventure.created_at);

  return (
    <div>
      <Input
        placeholder='Adventure Title'
        value={adventureName}
        onChange={(e) => {
          setAdventureName(e.target.value);
          updateAdventure({ name: e.target.value });
        }}
        className='adventure-title-input'
      />

      <ul className={cn('adventure-facts')}>
        <li>
          Started: <span>{startDate}</span>
        </li>
        <li>
          Sessions: <span>0</span>
        </li>
        <li>
          NPCs: <span>0</span>
        </li>
        <li>
          PCs: <span>0</span>
        </li>
        <li>
          Party Level: <span>0</span>
        </li>
      </ul>
    </div>
  );
};
