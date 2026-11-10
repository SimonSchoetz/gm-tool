import { PinIcon, PinOffIcon, LucideIcon } from 'lucide-react';

type RowActionOption = {
  key: string;
  Icon: LucideIcon;
  label: string;
};

export const getRowActionOptions = (isPinned: boolean): RowActionOption[] =>
  isPinned
    ? [{ key: 'unpin', Icon: PinOffIcon, label: 'Unpin' }]
    : [{ key: 'pin', Icon: PinIcon, label: 'Pin' }];
