import {
  ArrowDownFromLineIcon,
  ArrowLeftFromLineIcon,
  ArrowRightFromLineIcon,
  ArrowUpFromLineIcon,
  Trash2Icon,
} from 'lucide-react';
import { describe, expect, it } from 'vitest';
import { getTableMenu } from '../getTableMenu';

describe('getTableMenu', () => {
  it('offers a row menu its header toggle label and the three row actions in order', () => {
    expect(getTableMenu('row')).toEqual({
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
    });
  });

  it('offers a column menu its header toggle label and the three column actions in order', () => {
    expect(getTableMenu('column')).toEqual({
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
    });
  });
});
