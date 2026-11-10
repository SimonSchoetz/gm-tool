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
  const shownEntityType = entityType ?? 'person';
  const Icon = ENTITY_PLACEHOLDER_ICONS[shownEntityType];
  const ariaLabel = `${entityTypeLabel(shownEntityType)} image placeholder`;
  return <Icon className={className} aria-label={ariaLabel} />;
};
