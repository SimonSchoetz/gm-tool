import {
  ArrowUpFromLineIcon,
  ArrowDownFromLineIcon,
  ArrowLeftFromLineIcon,
  ArrowRightFromLineIcon,
  Trash2Icon,
  type LucideIcon,
} from 'lucide-react';

export type TableCellMutation =
  | 'insertRowAbove'
  | 'insertRowBelow'
  | 'deleteRow'
  | 'insertColumnLeft'
  | 'insertColumnRight'
  | 'deleteColumn';

type TableMenuAction = {
  mutation: TableCellMutation;
  Icon: LucideIcon;
  label: string;
};

type TableMenu = {
  toggleHeaderLabel: string;
  actions: TableMenuAction[];
};

const ROW_MENU: TableMenu = {
  toggleHeaderLabel: 'Toggle header row',
  actions: [
    {
      mutation: 'insertRowAbove',
      Icon: ArrowUpFromLineIcon,
      label: 'Insert above',
    },
    {
      mutation: 'insertRowBelow',
      Icon: ArrowDownFromLineIcon,
      label: 'Insert below',
    },
    { mutation: 'deleteRow', Icon: Trash2Icon, label: 'Delete row' },
  ],
};

const COLUMN_MENU: TableMenu = {
  toggleHeaderLabel: 'Toggle header column',
  actions: [
    {
      mutation: 'insertColumnLeft',
      Icon: ArrowLeftFromLineIcon,
      label: 'Insert left',
    },
    {
      mutation: 'insertColumnRight',
      Icon: ArrowRightFromLineIcon,
      label: 'Insert right',
    },
    { mutation: 'deleteColumn', Icon: Trash2Icon, label: 'Delete column' },
  ],
};

export const getTableMenu = (type: 'row' | 'column'): TableMenu =>
  type === 'row' ? ROW_MENU : COLUMN_MENU;
