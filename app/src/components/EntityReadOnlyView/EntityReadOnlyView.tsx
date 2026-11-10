import { useRef } from 'react';
import { FCProps } from '@/types/fcProps.type';
import {
  useBaseEntity,
  useBaseEntityContentSections,
} from '@/data-access-layer';
import { useListNavigation } from '@/hooks/useListNavigation';
import type { BaseEntityType } from '@domain/entities';
import { ContentSectionBody } from '../ContentSectionBody';
import { ContentSectionNav } from '../ContentSectionNav/ContentSectionNav';
import { ContentSectionNavToggle } from '../ContentSectionNavToggle/ContentSectionNavToggle';
import { EntityPopupBody } from '../EntityPopupBody/EntityPopupBody';
import type { EntitySectionHeaderLeading } from '../EntitySectionHeaderLeading/EntitySectionHeaderLeading';
import { SlideTransition } from '../SlideTransition/SlideTransition';
import { UpDownBtns } from '../UpDownBtns/UpDownBtns';
import './EntityReadOnlyView.css';

type HeaderProps = React.ComponentProps<typeof EntitySectionHeaderLeading>;

type Props = {
  entityType: BaseEntityType;
  entityId: string;
  adventureId: string | null;
  Header: FCProps<HeaderProps>;
  navZIndex: number | null;
  onImageOpen?: () => void;
};

export const EntityReadOnlyView: FCProps<Props> = ({
  entityType,
  entityId,
  adventureId,
  Header,
  navZIndex,
  onImageOpen,
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
  const burgerRef = useRef<HTMLButtonElement | null>(null);

  if (loading || sectionsLoading || !baseEntity) return <Header />;

  const headerSlots: HeaderProps =
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

  const slide =
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
        };

  return (
    <>
      <Header {...headerSlots} />
      <EntityPopupBody
        imageId={baseEntity.image_id}
        imageTitle={baseEntity.name}
        {...(onImageOpen && { onImageOpen })}
      >
        {selected && (
          <SlideTransition
            className='entity-read-only-view-region'
            slide={slide}
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
        // The section menu is portaled by AnchoredPopup out of this view's DOM, and React computes mouse leave over the React tree, so a host that closes on leave (an unpinned mention popup) still counts the menu as inside it; the middle column has no such host.
        <ContentSectionNav
          baseEntityId={entityId}
          activeId={selected?.id ?? null}
          anchorRef={burgerRef}
          popupZIndex={navZIndex}
          onSelect={select}
          onClose={closeNav}
          newItem={null}
          newItemRef={null}
        />
      )}
    </>
  );
};
