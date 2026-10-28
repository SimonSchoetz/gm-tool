import { CSS } from '@dnd-kit/utilities';
import { useSortable } from '@dnd-kit/sortable';
import { FCProps } from '@/types/fcProps.type';
import { cn } from '@/util/className';
import { EncounterEntityImage } from '../../../EncounterEntityImage/EncounterEntityImage';
import { describeQueueEntryHp } from './helper/describeQueueEntryHp';
import './EncounterQueueEntry.css';

type Props = {
  id: string;
  name: string;
  imageId: string | null;
  maxHp: number | null;
  currentHp: number | null;
  tempHp: number;
};

export const EncounterQueueEntry: FCProps<Props> = ({
  id,
  name,
  imageId,
  maxHp,
  currentHp,
  tempHp,
}) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    setActivatorNodeRef,
    transform,
    transition,
  } = useSortable({ id });
  const hp = describeQueueEntryHp({ maxHp, currentHp, tempHp });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    ...(hp ? { '--rt-encounter-queue-entry-hp-lost': hp.lostShare } : {}),
  } as React.CSSProperties;

  return (
    <div ref={setNodeRef} style={style} className='encounter-queue-entry'>
      <span
        ref={setActivatorNodeRef}
        className='encounter-queue-entry-handle'
        {...attributes}
        {...listeners}
      >
        ⠿
      </span>

      <div
        className={cn(
          'encounter-queue-entry-image',
          hp?.state === 'down' && 'encounter-queue-entry-image--down',
        )}
      >
        <EncounterEntityImage imageId={imageId} size={64} />
        {hp?.state === 'hurt' && <div className='encounter-queue-entry-tint' />}
      </div>

      <div className='encounter-queue-entry-text'>
        <div className='clip-text'>{name}</div>
        {hp && <div className='encounter-queue-entry-hp'>{hp.text}</div>}
      </div>
    </div>
  );
};
