import type { RefObject } from 'react';
import { useBaseEntityContentSections } from '@/data-access-layer';
import { FCProps } from '@/types/fcProps.type';
import { contentSectionLabel } from '@domain';
import { AnchoredPopup } from '../AnchoredPopup';
import { PopupSurface } from '../PopupSurface/PopupSurface';
import { ReorderableNavList } from '../ReorderableNavList';
import './ContentSectionNav.css';

type Props = {
  baseEntityId: string;
  activeId: string | null;
  anchorRef: RefObject<HTMLButtonElement | null>;
  popupZIndex: number | null;
  onSelect: (id: string) => void;
  onClose: () => void;
  newItem: React.ComponentProps<typeof ReorderableNavList>['newItem'];
  newItemRef: React.ComponentProps<typeof ReorderableNavList>['newItemRef'];
};

export const ContentSectionNav: FCProps<Props> = ({
  baseEntityId,
  activeId,
  anchorRef,
  popupZIndex,
  onSelect,
  onClose,
  newItem,
  newItemRef,
}) => {
  const { sections, bulkReorder } = useBaseEntityContentSections(baseEntityId);

  return (
    <AnchoredPopup
      getAnchorRect={() => anchorRef.current?.getBoundingClientRect() ?? null}
      zIndex={popupZIndex}
      onClickOutside={(event) => {
        // The anchor's own click toggles the nav, so closing on its mousedown would reopen it on the click.
        if (anchorRef.current?.contains(event.target as Node)) return;
        onClose();
      }}
    >
      <PopupSurface className='content-section-nav'>
        <ReorderableNavList
          items={sections.map((section) => ({
            id: section.id,
            label: contentSectionLabel(section.name, section.type),
            isChecked: false,
          }))}
          activeId={activeId}
          onSelect={onSelect}
          onReorder={bulkReorder}
          newItem={newItem}
          newItemRef={newItemRef}
        />
      </PopupSurface>
    </AnchoredPopup>
  );
};
