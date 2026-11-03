import { FCProps } from '@/types/fcProps.type';
import type { BaseEntityType } from '@domain/entities';
import { EntityReadOnlyView } from '../../../../../EntityReadOnlyView/EntityReadOnlyView';
import { useMentionPopupHeader } from '../../../../hooks/useMentionPopupHeader';
import { MentionPopupHeader } from '../../../MentionPopupHeader/MentionPopupHeader';

type Props = {
  entityType: BaseEntityType;
  entityId: string;
  adventureId: string | null;
};

export const BaseEntityPopupContent: FCProps<Props> = ({
  entityType,
  entityId,
  adventureId,
}) => {
  const { zIndex, onPin } = useMentionPopupHeader();

  return (
    <EntityReadOnlyView
      entityType={entityType}
      entityId={entityId}
      adventureId={adventureId}
      Header={MentionPopupHeader}
      navZIndex={zIndex}
      onImageOpen={onPin}
    />
  );
};
