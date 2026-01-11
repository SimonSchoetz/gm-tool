import * as Icon from 'lucide-react';
import { ComponentProps } from 'react';
import { TextFormatBtn } from './components';

type TextFormatBtnConfig = Omit<
  ComponentProps<typeof TextFormatBtn>,
  'isActive'
>;

export const textFormatBtns: TextFormatBtnConfig[] = [
  { label: 'Bold', formatType: 'bold', icon: Icon.BoldIcon },
  {
    label: 'Italic',
    formatType: 'italic',
    icon: Icon.ItalicIcon,
  },
];
