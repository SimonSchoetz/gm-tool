import { useRef } from 'react';
import { FCProps } from '@/types/fcProps.type';
import {
  useBaseEntity,
  useBaseEntityContentSections,
} from '@/data-access-layer';
import { useListNavigation } from '@/hooks/useListNavigation';
import type { BaseEntityType } from '@domain/entities';
import { ContentSectionNav } from '../../../../../ContentSectionNav/ContentSectionNav';
import { ContentSectionNavToggle } from '../../../../../ContentSectionNavToggle/ContentSectionNavToggle';
import { useMentionPopupHeader } from '../../../../hooks/useMentionPopupHeader';
import { MentionPopupHeader } from '../../../MentionPopupHeader/MentionPopupHeader';
import { EntityPopupBody } from '../EntityPopupBody/EntityPopupBody';

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
  const { baseEntity, loading } = useBaseEntity(
    entityType,
    entityId,
    adventureId ?? '',
  );
  const { sections, loading: sectionsLoading } =
    useBaseEntityContentSections(entityId);
  const {
    selected,
    isNavAvailable,
    isNavVisible,
    select,
    toggleNav,
    closeNav,
  } = useListNavigation(sections);
  const { zIndex } = useMentionPopupHeader();
  const burgerRef = useRef<HTMLButtonElement | null>(null);

  if (loading || sectionsLoading || !baseEntity) return <MentionPopupHeader />;

  const headerSlots: React.ComponentProps<typeof MentionPopupHeader> = selected
    ? {
        titleSuffix: ` | ${selected.name ?? ''}`,
        leading: isNavAvailable ? (
          <ContentSectionNavToggle
            ref={burgerRef}
            isOpen={isNavVisible}
            onToggle={toggleNav}
          />
        ) : null,
      }
    : {};

  return (
    <>
      <MentionPopupHeader {...headerSlots} />
      <EntityPopupBody
        summary={selected?.content ?? null}
        imageId={baseEntity.image_id}
        // The section id makes EntityPopupBody's TextEditor remount on a section switch instead of showing the previous section.
        textEditorId={
          selected
            ? `content-section-popup-${selected.id}`
            : `${entityType}-popup-${entityId}`
        }
      />
      {isNavVisible && (
        // Portaled by AnchoredPopup. React computes an unpinned MentionPopup's mouse leave over the React tree, where this popup is a descendant, so moving the pointer into it does not remove the MentionPopup.
        <ContentSectionNav
          baseEntityId={entityId}
          activeId={selected?.id ?? null}
          anchorRef={burgerRef}
          popupZIndex={zIndex}
          onSelect={select}
          onClose={closeNav}
          newItem={null}
          newItemRef={null}
        />
      )}
    </>
  );
};
