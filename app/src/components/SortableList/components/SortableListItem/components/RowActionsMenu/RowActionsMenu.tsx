import { useRef, useState } from 'react';
import { EllipsisVerticalIcon } from 'lucide-react';
import { FCProps } from '@/types/fcProps.type';
import { useTableConfig, useSetPinnedOrder } from '@/data-access-layer';
import { AnchoredPopup } from '../../../../../AnchoredPopup';
import { PopupSurface } from '../../../../../PopupSurface/PopupSurface';
import { MenuOptionRow } from '../../../../../MenuOptionRow/MenuOptionRow';
import { ClickableIcon } from '../../../../../ClickableIcon/ClickableIcon';
import { getRowActionOptions } from './helper/getRowActionOptions';
import './RowActionsMenu.css';

type Props = {
  tableConfigId: string;
  itemId: string;
  isPinned: boolean;
};

export const RowActionsMenu: FCProps<Props> = ({
  tableConfigId,
  itemId,
  isPinned,
}) => {
  const { config } = useTableConfig(tableConfigId);
  const [isOpen, setIsOpen] = useState(false);
  const triggerRef = useRef<HTMLButtonElement | null>(null);

  const { pinItem, unpinItem } = useSetPinnedOrder(
    config?.table_name ?? '',
    itemId,
  );

  const handlePinToggle = async (): Promise<void> => {
    if (isPinned) {
      await unpinItem();
    } else {
      await pinItem();
    }
    setIsOpen(false);
  };

  const options = getRowActionOptions(isPinned);

  const onToggle = () => {
    setIsOpen((prev) => !prev);
  };

  const getAnchorRect = () =>
    triggerRef.current?.getBoundingClientRect() ?? null;

  const onClickOutside = () => {
    setIsOpen(false);
  };

  const onOptionClick = () => {
    void handlePinToggle();
  };

  return (
    <>
      <div className='row-actions-menu-trigger'>
        <ClickableIcon
          ref={triggerRef}
          icon={<EllipsisVerticalIcon />}
          label='Row actions'
          onClick={onToggle}
        />
      </div>

      {isOpen && (
        <AnchoredPopup
          getAnchorRect={getAnchorRect}
          onClickOutside={onClickOutside}
        >
          <PopupSurface className='row-actions-menu-popup'>
            <ul>
              {options.map((option) => (
                <li key={option.key}>
                  <MenuOptionRow
                    Icon={option.Icon}
                    label={option.label}
                    onClick={onOptionClick}
                  />
                </li>
              ))}
            </ul>
          </PopupSurface>
        </AnchoredPopup>
      )}
    </>
  );
};
