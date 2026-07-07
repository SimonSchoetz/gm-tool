import { FCProps } from '@/types';
import {
  Table2Icon,
  ArrowUpFromLineIcon,
  ArrowDownFromLineIcon,
  ArrowLeftFromLineIcon,
  ArrowRightFromLineIcon,
  Trash2Icon,
} from 'lucide-react';
import './TableHandleMenu.css';
import { PopupState } from '../../TableEdgeHandlePlugin';
import {
  getTableObserverFromTableElement,
  TableCellHeaderStates,
  $insertTableRowAtSelection,
  $insertTableColumnAtSelection,
  $deleteTableRowAtSelection,
  $deleteTableColumnAtSelection,
} from '@lexical/table';
import { runTableCellMutation } from './helper';
import { TableHandleMenuItem } from './components';
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

  if (!popupState) return null;

  const { type, isHeader } = popupState;

  const handleTableCellMutation = (
    mutation:
      | 'insertRowAbove'
      | 'insertRowBelow'
      | 'deleteRow'
      | 'insertColumnLeft'
      | 'insertColumnRight'
      | 'deleteColumn',
  ): void => {
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

  return (
    <>
      <TableHandleMenuItem
        Icon={Table2Icon}
        label={type === 'row' ? 'Toggle header row' : 'Toggle header column'}
        onClick={() => {
          handleToggleHeader();
        }}
        isActive={isHeader}
      />

      <div className='table-handle-menu-divider' />

      <TableHandleMenuItem
        Icon={type === 'row' ? ArrowUpFromLineIcon : ArrowLeftFromLineIcon}
        label={type === 'row' ? 'Insert above' : 'Insert left'}
        onClick={
          popupState.type === 'row'
            ? () => {
                handleTableCellMutation('insertRowAbove');
              }
            : () => {
                handleTableCellMutation('insertColumnLeft');
              }
        }
      />

      <TableHandleMenuItem
        Icon={type === 'row' ? ArrowDownFromLineIcon : ArrowRightFromLineIcon}
        label={type === 'row' ? 'Insert below' : 'Insert right'}
        onClick={
          popupState.type === 'row'
            ? () => {
                handleTableCellMutation('insertRowBelow');
              }
            : () => {
                handleTableCellMutation('insertColumnRight');
              }
        }
      />

      <TableHandleMenuItem
        Icon={Trash2Icon}
        label={type === 'row' ? 'Delete row' : 'Delete column'}
        onClick={
          popupState.type === 'row'
            ? () => {
                handleTableCellMutation('deleteRow');
              }
            : () => {
                handleTableCellMutation('deleteColumn');
              }
        }
      />
    </>
  );
};
