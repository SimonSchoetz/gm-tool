import { CSS } from '@dnd-kit/utilities';
import { useSortable } from '@dnd-kit/sortable';
import { FCProps } from '@/types/fcProps.type';
import { cn } from '@/util/className';
import { EncounterEntityImage } from '../../../EncounterEntityImage/EncounterEntityImage';
import type { SelectionModifiers } from '../../../../helper/applySelectionClick';
import { describeQueueEntryHp } from '../../../../helper/describeQueueEntryHp';
import { describeQueueEntryImage } from './helper/describeQueueEntryImage';
import { QUEUE_ENTRY_IMAGE_SIZE } from './EncounterQueueEntry.constants';
import { EncounterQueueEventTile } from './components/EncounterQueueEventTile/EncounterQueueEventTile';
import './EncounterQueueEntry.css';

type KindProps =
  | {
      kind: 'combatant';
      id: string;
      name: string;
      imageId: string | null;
      maxHp: number | null;
      currentHp: number | null;
      tempHp: number;
      defeated: boolean;
    }
  | { kind: 'event'; id: string; name: string };

type Props = {
  selected: boolean;
  otherDraggedCount: number;
  onSelect: (id: string, modifiers: SelectionModifiers) => void;
} & KindProps;

export const EncounterQueueEntry: FCProps<Props> = (props) => {
  const { id, name, selected, otherDraggedCount, onSelect } = props;
  const {
    attributes,
    listeners,
    setNodeRef,
    setActivatorNodeRef,
    transform,
    transition,
  } = useSortable({ id });
  const hp = props.kind === 'combatant' ? describeQueueEntryHp(props) : null;
  const imageLook =
    // Stryker disable next-line ConditionalExpression: an event has no defeated flag and no HP, so describeQueueEntryImage returns plain for it too and no input observes a difference
    props.kind === 'combatant'
      ? describeQueueEntryImage(hp, props.defeated)
      : // Stryker disable next-line StringLiteral: class names only; jsdom computes no style and component tests may not assert a class name
        'plain';
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
        {props.kind === 'event' ? (
          <EncounterQueueEventTile />
        ) : (
          <EncounterEntityImage
            imageId={props.imageId}
            size={QUEUE_ENTRY_IMAGE_SIZE}
          />
        )}
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
