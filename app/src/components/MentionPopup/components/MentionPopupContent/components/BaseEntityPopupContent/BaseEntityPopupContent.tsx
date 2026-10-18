import { FCProps } from '@/types/fcProps.type';
import {
  useBaseEntity,
  useBaseEntityContentSections,
} from '@/data-access-layer';
import { useListNavigation } from '@/hooks/useListNavigation';
import type { BaseEntityType } from '@domain/entities';
import { ContentSectionNav } from '../../../../../ContentSectionNav/ContentSectionNav';
import { ContentSectionNavToggle } from '../../../../../ContentSectionNavToggle/ContentSectionNavToggle';
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
  const { selected, isNavAvailable, isNavVisible, select, toggleNav } =
    useListNavigation(sections);

  if (loading || sectionsLoading || !baseEntity) return <MentionPopupHeader />;

  const headerSlots: React.ComponentProps<typeof MentionPopupHeader> = selected
    ? {
        titleSuffix: ` | ${selected.name ?? ''}`,
        leading: isNavAvailable ? (
          <ContentSectionNavToggle isOpen={isNavVisible} onToggle={toggleNav} />
        ) : undefined,
      }
    : {};

  return (
    <>
      <MentionPopupHeader {...headerSlots} />
      {isNavVisible ? (
        // Rendered inline in place of EntityPopupBody, never through AnchoredPopup's portal: an unpinned MentionPopup removes itself on mouse leave.
        <ContentSectionNav
          baseEntityId={entityId}
          activeId={selected?.id ?? null}
          onSelect={select}
          newItem={null}
          newItemRef={null}
        />
      ) : (
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
      )}
    </>
  );
};
