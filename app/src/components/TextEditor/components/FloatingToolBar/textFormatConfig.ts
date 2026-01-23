import * as Icon from 'lucide-react';
import { ComponentProps } from 'react';
import { TextFormatBtn, NodeTypeBtn } from './components';

type TextFormatBtnConfig = Omit<
  ComponentProps<typeof TextFormatBtn>,
  'isActive'
>;

type NodeTypeBtnConfig = Omit<ComponentProps<typeof NodeTypeBtn>, 'isActive'>;

export const textFormatBtns: TextFormatBtnConfig[] = [
  { label: 'Bold', formatType: 'bold', icon: Icon.BoldIcon },
  {
    label: 'Italic',
    formatType: 'italic',
    icon: Icon.ItalicIcon,
  },
];

export const nodeTypeBtns: NodeTypeBtnConfig[] = [
  {
    label: 'Heading 1',
    nodeType: 'h1',
    icon: Icon.Heading1Icon,
  },
  {
    label: 'Heading 2',
    nodeType: 'h2',
    icon: Icon.Heading2Icon,
  },
  {
    label: 'Heading 3',
    nodeType: 'h3',
    icon: Icon.Heading3Icon,
  },
];
