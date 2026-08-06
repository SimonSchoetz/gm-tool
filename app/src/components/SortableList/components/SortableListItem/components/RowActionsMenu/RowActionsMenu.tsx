import { useRef, useState } from 'react';
import {
  EllipsisVerticalIcon,
  PinIcon,
  PinOffIcon,
  LucideIcon,
} from 'lucide-react';
import { FCProps } from '@/types';
import { useTableConfig, useSetPinnedOrder } from '@/data-access-layer';
import { AnchoredPopup } from '../../../../../AnchoredPopup';
import { PopupSurface } from '../../../../../PopupSurface/PopupSurface';
import { MenuOptionRow } from '../../../../../MenuOptionRow/MenuOptionRow';
import { ClickableIcon } from '../../../../../ClickableIcon/ClickableIcon';
import './RowActionsMenu.css';

type Props = {
  tableConfigId: string;
  itemId: string;
  isPinned: boolean;
};

type MenuOption = {
  key: string;
  Icon: LucideIcon;
  label: string;
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

  const options: MenuOption[] = isPinned
    ? [{ key: 'unpin', Icon: PinOffIcon, label: 'Unpin' }]
    : [{ key: 'pin', Icon: PinIcon, label: 'Pin' }];

  return (
    <>
      <ClickableIcon
        ref={triggerRef}
        className='row-actions-menu-trigger'
        icon={<EllipsisVerticalIcon />}
        label='Row actions'
        onClick={() => {
          setIsOpen((prev) => !prev);
        }}
      />

      {isOpen && (
        <AnchoredPopup
          getAnchorRect={() =>
            triggerRef.current?.getBoundingClientRect() ?? null
          }
          onClickOutside={() => {
            setIsOpen(false);
          }}
        >
          <PopupSurface>
            <ul>
              {options.map((option) => (
                <MenuOptionRow
                  key={option.key}
                  Icon={option.Icon}
                  label={option.label}
                  onClick={() => {
                    void handlePinToggle();
                  }}
                />
              ))}
            </ul>
          </PopupSurface>
        </AnchoredPopup>
      )}
    </>
  );
};
