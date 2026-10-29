import { CSS } from '@dnd-kit/utilities';
import { useSortable } from '@dnd-kit/sortable';
import { FCProps } from '@/types/fcProps.type';
import { cn } from '@/util/className';
import { EncounterEntityImage } from '../../../EncounterEntityImage/EncounterEntityImage';
import type { SelectionModifiers } from '../../../../helper/applySelectionClick';
import { describeQueueEntryHp } from '../../../../helper/describeQueueEntryHp';
import { describeQueueEntryImage } from './helper/describeQueueEntryImage';
import './EncounterQueueEntry.css';

type Props = {
  id: string;
  name: string;
  imageId: string | null;
  maxHp: number | null;
  currentHp: number | null;
  tempHp: number;
  defeated: boolean;
  selected: boolean;
  otherDraggedCount: number;
  onSelect: (id: string, modifiers: SelectionModifiers) => void;
};

export const EncounterQueueEntry: FCProps<Props> = ({
  id,
  name,
  imageId,
  maxHp,
  currentHp,
  tempHp,
  defeated,
  selected,
  otherDraggedCount,
  onSelect,
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
  const imageLook = describeQueueEntryImage(hp, defeated);
  const imageClassName = cn(
    // Stryker disable next-line StringLiteral: class names only; jsdom computes no style and component tests may not assert a class name
    'encounter-queue-entry-image',
    // Stryker disable next-line StringLiteral: class names only; jsdom computes no style and component tests may not assert a class name
    `encounter-queue-entry-image--${imageLook}`,
  );

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    ...(hp ? { '--rt-encounter-queue-entry-hp-lost': hp.lostShare } : {}),
  } as React.CSSProperties;

  return (
    <div
      ref={setNodeRef}
      style={style}
      // Stryker disable next-line StringLiteral: class names only; jsdom computes no style and component tests may not assert a class name
      className='encounter-queue-entry'
      aria-current={selected ? 'true' : undefined}
      onClick={(event) => {
        onSelect(id, {
          shift: event.shiftKey,
          toggle: event.metaKey || event.ctrlKey,
        });
      }}
    >
      <span
        ref={setActivatorNodeRef}
        className='encounter-queue-entry-handle'
        {...attributes}
        {...listeners}
      >
        ⠿
      </span>

      <div
        className={imageClassName}
        aria-label={imageLook === 'grey' ? 'Greyed-out image' : undefined}
      >
        <EncounterEntityImage imageId={imageId} size={64} />
        {imageLook === 'tint' && (
          <div
            // Stryker disable next-line StringLiteral: class names only; jsdom computes no style and component tests may not assert a class name
            className='encounter-queue-entry-tint'
            aria-label='Damage tint'
          />
        )}
      </div>

      <div className='encounter-queue-entry-text'>
        <div className='clip-text'>{name}</div>
        {hp && <div className='encounter-queue-entry-hp'>{hp.text}</div>}
      </div>

      {otherDraggedCount > 0 && (
        <span
          // Stryker disable next-line StringLiteral: class names only; jsdom computes no style and component tests may not assert a class name
          className='encounter-queue-entry-badge'
        >
          +{otherDraggedCount}
        </span>
      )}
    </div>
  );
};
