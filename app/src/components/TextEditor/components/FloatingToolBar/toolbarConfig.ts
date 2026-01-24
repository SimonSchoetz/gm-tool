import * as Icon from 'lucide-react';
import { ComponentProps } from 'react';
import { TextFormatBtn, NodeTypeBtn } from './components';

type TextFormatBtnConfig = ComponentProps<typeof TextFormatBtn>;

type NodeTypeBtnConfig = ComponentProps<typeof NodeTypeBtn>;

/**
 * Styles must be added in TextEditor.tsx
 */
export const textFormatBtns: TextFormatBtnConfig[] = [
  { label: 'Bold', formatType: 'bold', icon: Icon.BoldIcon },
  {
    label: 'Italic',
    formatType: 'italic',
    icon: Icon.ItalicIcon,
  },
  {
    label: 'Underline',
    formatType: 'underline',
    icon: Icon.UnderlineIcon,
  },
  {
    label: 'Strikethrough',
    formatType: 'strikethrough',
    icon: Icon.StrikethroughIcon,
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
