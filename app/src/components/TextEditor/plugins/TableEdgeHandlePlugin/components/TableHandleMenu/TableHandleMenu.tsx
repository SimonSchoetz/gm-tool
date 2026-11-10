import { FCProps } from '@/types/fcProps.type';
import { Table2Icon } from 'lucide-react';
import './TableHandleMenu.css';
import { PopupState } from '../../types';
import {
  getTableObserverFromTableElement,
  TableCellHeaderStates,
  $insertTableRowAtSelection,
  $insertTableColumnAtSelection,
  $deleteTableRowAtSelection,
  $deleteTableColumnAtSelection,
} from '@lexical/table';
import { getTableMenu, type TableCellMutation } from './helper/getTableMenu';
import { runTableCellMutation } from './helper/runTableCellMutation';
import { MenuOptionRow } from '../../../../../MenuOptionRow/MenuOptionRow';
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';

type Props = {
  popupState: PopupState;
  setPopupState: React.Dispatch<React.SetStateAction<PopupState>>;
  closePopup: () => void;
};

export const TableHandleMenu: FCProps<Props> = ({
  popupState,
  setPopupState,
  closePopup,
}) => {
  const [editor] = useLexicalComposerContext();

  if (!popupState) return;

  const { type, isHeader } = popupState;

  const handleTableCellMutation = (mutation: TableCellMutation): void => {
    runTableCellMutation(
      editor,
      popupState.cellX,
      popupState.cellY,
      popupState.tableElement,
      () => {
        switch (mutation) {
          case 'insertRowAbove':
            $insertTableRowAtSelection(false);
            break;
          case 'insertRowBelow':
            $insertTableRowAtSelection(true);
            break;
          case 'deleteRow':
            $deleteTableRowAtSelection();
            break;
          case 'insertColumnLeft':
            $insertTableColumnAtSelection(false);
            break;
          case 'insertColumnRight':
            $insertTableColumnAtSelection(true);
            break;
          case 'deleteColumn':
            $deleteTableColumnAtSelection();
            break;
        }
      },
    );
    closePopup();
  };

  const handleToggleHeader = (): void => {
    editor.update(() => {
      const observer = getTableObserverFromTableElement(
        popupState.tableElement,
      );
      if (!observer) return;
      const { tableNode } = observer.$lookup();
      const table = observer.getTable();

      if (type === 'row') {
        const targetState = popupState.isHeader
          ? TableCellHeaderStates.NO_STATUS
          : TableCellHeaderStates.ROW;
        for (let x = 0; x < table.columns; x++) {
          tableNode
            .getCellNodeFromCords(x, popupState.cellY, table)
            ?.setHeaderStyles(targetState, TableCellHeaderStates.ROW);
        }
      } else {
        const targetState = popupState.isHeader
          ? TableCellHeaderStates.NO_STATUS
          : TableCellHeaderStates.COLUMN;
        for (let y = 0; y < table.rows; y++) {
          tableNode
            .getCellNodeFromCords(popupState.cellX, y, table)
            ?.setHeaderStyles(targetState, TableCellHeaderStates.COLUMN);
        }
      }
    });
    setPopupState((prev) =>
      prev ? { ...prev, isHeader: !prev.isHeader } : null,
    );
  };

  const { toggleHeaderLabel, actions } = getTableMenu(type);

  return (
    <div className='table-handle-menu'>
      <MenuOptionRow
        Icon={Table2Icon}
        label={toggleHeaderLabel}
        onClick={handleToggleHeader}
        isActive={isHeader}
      />

      <div className='table-handle-menu--divider' />

      {actions.map((action) => (
        <MenuOptionRow
          key={action.mutation}
          Icon={action.Icon}
          label={action.label}
          onClick={() => {
            handleTableCellMutation(action.mutation);
          }}
        />
      ))}
    </div>
  );
};
