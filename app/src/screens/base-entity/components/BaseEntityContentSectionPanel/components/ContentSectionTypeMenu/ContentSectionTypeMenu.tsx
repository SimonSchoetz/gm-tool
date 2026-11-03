import { AnchoredPopup } from '@/components/AnchoredPopup';
import { MenuOptionRow } from '@/components/MenuOptionRow/MenuOptionRow';
import { PopupSurface } from '@/components/PopupSurface/PopupSurface';
import { FCProps } from '@/types/fcProps.type';
import {
  BASE_ENTITY_CONTENT_SECTION_TYPES,
  contentSectionTypeLabel,
  type BaseEntityContentSectionType,
} from '@domain';
import './ContentSectionTypeMenu.css';

type Props = {
  getAnchorRect: () => DOMRect | null;
  onSelect: (type: BaseEntityContentSectionType) => void;
  onClose: () => void;
};

export const ContentSectionTypeMenu: FCProps<Props> = ({
  getAnchorRect,
  onSelect,
  onClose,
}) => (
  <AnchoredPopup getAnchorRect={getAnchorRect} onClickOutside={onClose}>
    <PopupSurface className='content-section-type-menu'>
      <ul>
        {BASE_ENTITY_CONTENT_SECTION_TYPES.map((type) => (
          <li key={type}>
            <MenuOptionRow
              label={contentSectionTypeLabel(type)}
              onClick={() => {
                onSelect(type);
              }}
            />
          </li>
        ))}
      </ul>
    </PopupSurface>
  </AnchoredPopup>
);
