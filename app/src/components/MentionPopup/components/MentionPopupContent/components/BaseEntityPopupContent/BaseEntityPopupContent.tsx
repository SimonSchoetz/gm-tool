import { useRef } from 'react';
import { FCProps } from '@/types/fcProps.type';
import {
  useBaseEntity,
  useBaseEntityContentSections,
} from '@/data-access-layer';
import { useListNavigation } from '@/hooks/useListNavigation';
import type { BaseEntityType } from '@domain/entities';
import { ContentSectionBody } from '../../../../../ContentSectionBody';
import { ContentSectionNav } from '../../../../../ContentSectionNav/ContentSectionNav';
import { ContentSectionNavToggle } from '../../../../../ContentSectionNavToggle/ContentSectionNavToggle';
import { SlideTransition } from '../../../../../SlideTransition/SlideTransition';
import { UpDownBtns } from '../../../../../UpDownBtns/UpDownBtns';
import { useMentionPopupHeader } from '../../../../hooks/useMentionPopupHeader';
import { MentionPopupHeader } from '../../../MentionPopupHeader/MentionPopupHeader';
import { EntityPopupBody } from '../EntityPopupBody/EntityPopupBody';
import './BaseEntityPopupContent.css';

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
    hasPrevious,
    hasNext,
    stepPrevious,
    stepNext,
    transition,
    endTransition,
  } = useListNavigation(sections);
  const { zIndex } = useMentionPopupHeader();
  const burgerRef = useRef<HTMLButtonElement | null>(null);

  if (loading || sectionsLoading || !baseEntity) return <MentionPopupHeader />;

  const headerSlots: React.ComponentProps<typeof MentionPopupHeader> =
    selected && isNavAvailable
      ? {
          sectionName: selected.name ?? '',
          controls: (
            <>
              <ContentSectionNavToggle
                ref={burgerRef}
                isOpen={isNavVisible}
                onToggle={toggleNav}
              />
              <UpDownBtns
                upLabel='Previous section'
                downLabel='Next section'
                isUpDisabled={!hasPrevious}
                isDownDisabled={!hasNext}
                onUp={stepPrevious}
                onDown={stepNext}
              />
            </>
          ),
        }
      : {};

  return (
    <>
      <MentionPopupHeader {...headerSlots} />
      <EntityPopupBody imageId={baseEntity.image_id}>
        {selected && (
          <SlideTransition
            className='base-entity-popup-content-region'
            slide={
              transition === null
                ? null
                : {
                    direction: transition.direction,
                    outgoing: (
                      <ContentSectionBody
                        section={transition.from}
                        baseEntityId={entityId}
                        readOnly
                      />
                    ),
                  }
            }
            onEnd={endTransition}
          >
            <ContentSectionBody
              section={selected}
              baseEntityId={entityId}
              readOnly
            />
          </SlideTransition>
        )}
      </EntityPopupBody>
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
