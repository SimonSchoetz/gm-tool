import { FCProps } from '@/types';
import { cn } from '@/util';
import {
  Table2 as Table2Icon,
  ArrowUpFromLine as ArrowUpFromLineIcon,
  ArrowDownFromLine as ArrowDownFromLineIcon,
  ArrowLeftFromLine as ArrowLeftFromLineIcon,
  ArrowRightFromLine as ArrowRightFromLineIcon,
  Trash2 as Trash2Icon,
} from 'lucide-react';
import './TableHandleMenu.css';

type Props = {
  type: 'row' | 'column';
  isHeader: boolean;
  onToggleHeader: () => void;
  onInsertBefore: () => void;
  onInsertAfter: () => void;
  onDelete: () => void;
};

export const TableHandleMenu: FCProps<Props> = ({
  type,
  isHeader,
  onToggleHeader,
  onInsertBefore,
  onInsertAfter,
  onDelete,
}) => {
  const InsertBeforeIcon =
    type === 'row' ? ArrowUpFromLineIcon : ArrowLeftFromLineIcon;
  const InsertAfterIcon =
    type === 'row' ? ArrowDownFromLineIcon : ArrowRightFromLineIcon;

  return (
    <div className='table-handle-menu'>
      <button
        type='button'
        className={cn(
          'table-handle-menu-item',
          isHeader && 'table-handle-menu-item--active',
        )}
        onClick={onToggleHeader}
      >
        <Table2Icon />
        <span>
          {type === 'row' ? 'Toggle header row' : 'Toggle header column'}
        </span>
      </button>
      <div className='table-handle-menu-divider' />
      <button
        type='button'
        className='table-handle-menu-item'
        onClick={onInsertBefore}
      >
        <InsertBeforeIcon />
        <span>{type === 'row' ? 'Insert above' : 'Insert left'}</span>
      </button>
      <button
        type='button'
        className='table-handle-menu-item'
        onClick={onInsertAfter}
      >
        <InsertAfterIcon />
        <span>{type === 'row' ? 'Insert below' : 'Insert right'}</span>
      </button>
      <button
        type='button'
        className='table-handle-menu-item'
        onClick={onDelete}
      >
        <Trash2Icon />
        <span>{type === 'row' ? 'Delete row' : 'Delete column'}</span>
      </button>
    </div>
  );
};
