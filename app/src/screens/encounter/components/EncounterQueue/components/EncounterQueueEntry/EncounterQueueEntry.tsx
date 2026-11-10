import { CSS } from '@dnd-kit/utilities';
import { useSortable } from '@dnd-kit/sortable';
import { FCProps } from '@/types/fcProps.type';
import type { BaseEntityType } from '@domain';
import { cn } from '@/util/className';
import { EncounterEntityImage } from '../../../EncounterEntityImage/EncounterEntityImage';
import type { SelectionModifiers } from '../../../../helper/applySelectionClick';
import { describeQueueEntryHp } from '../../../../helper/describeQueueEntryHp';
import { describeQueueEntryImage } from './helper/describeQueueEntryImage';
import { getAriaCurrent } from './helper/getAriaCurrent';
import { getImageAriaLabel } from './helper/getImageAriaLabel';
import { QUEUE_ENTRY_IMAGE_SIZE } from './EncounterQueueEntry.constants';
import { EncounterQueueEventTile } from './components/EncounterQueueEventTile/EncounterQueueEventTile';
import './EncounterQueueEntry.css';

type KindProps =
  | {
      kind: 'combatant';
      id: string;
      name: string;
      imageId: string | null;
      entity: { entityType: BaseEntityType } | null;
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
    // An event has no defeated flag and no HP, so `describeQueueEntryImage` would return plain for it too.
    props.kind === 'combatant'
      ? describeQueueEntryImage(hp, props.defeated)
      : 'plain';
  const imageClassName = cn(
    'encounter-queue-entry-image',
    `encounter-queue-entry-image--${imageLook}`,
  );

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    ...(hp ? { '--rt-encounter-queue-entry-hp-lost': hp.lostShare } : {}),
  } as React.CSSProperties;

  const ariaCurrent = getAriaCurrent(selected);
  const imageAriaLabel = getImageAriaLabel(imageLook);

  const onEntryClick = (event: React.MouseEvent<HTMLDivElement>) => {
    onSelect(id, {
      shift: event.shiftKey,
      toggle: event.metaKey || event.ctrlKey,
    });
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className='encounter-queue-entry'
      aria-current={ariaCurrent ?? undefined}
      onClick={onEntryClick}
      title={name}
    >
      <div
        ref={setActivatorNodeRef}
        className='encounter-queue-entry-handle content-center'
        {...attributes}
        {...listeners}
      >
        ⠿
      </div>

      <div className={imageClassName} aria-label={imageAriaLabel ?? undefined}>
        {props.kind === 'event' ? (
          <EncounterQueueEventTile />
        ) : (
          <EncounterEntityImage
            imageId={props.imageId}
            entityType={props.entity?.entityType ?? null}
            size={QUEUE_ENTRY_IMAGE_SIZE}
          />
        )}
        {imageLook === 'tint' && (
          <div
            className='encounter-queue-entry-tint'
            aria-label='Damage tint'
          />
        )}
      </div>

      {hp && <div className='label encounter-queue-entry-hp'>{hp.text}</div>}

      {otherDraggedCount > 0 && (
        <span className='encounter-queue-entry-badge'>
          +{otherDraggedCount}
        </span>
      )}
    </div>
  );
};
