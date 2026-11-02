import { entityTypeLabel } from '@domain';
import { FCProps } from '@/types/fcProps.type';
import {
  ENTITY_PLACEHOLDER_ICONS,
  type ImagePlaceholderEntityType,
} from './entityPlaceholderIcons';

type Props = {
  entityType: ImagePlaceholderEntityType | null;
  className: string;
};

export const EntityPlaceholderIcon: FCProps<Props> = ({
  entityType,
  className,
}) => {
  const Icon = ENTITY_PLACEHOLDER_ICONS[entityType ?? 'person'];
  return (
    <Icon
      className={className}
      aria-label={`${entityTypeLabel(entityType ?? 'person')} image placeholder`}
    />
  );
};
