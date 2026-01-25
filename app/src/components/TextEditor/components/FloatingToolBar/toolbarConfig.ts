import * as Icon from 'lucide-react';
import { ComponentProps } from 'react';
import { TextFormatBtn, HeadingBtn, ListBtn } from './components';

/**
 * Styles must be added in TextEditor.tsx
 */

type TextFormatBtnConfig = ComponentProps<typeof TextFormatBtn>;

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

type HeadingBtnConfig = ComponentProps<typeof HeadingBtn>;

export const headingBtns: HeadingBtnConfig[] = [
  {
    label: 'Heading 1',
    headingType: 'h1',
    icon: Icon.Heading1Icon,
  },
  {
    label: 'Heading 2',
    headingType: 'h2',
    icon: Icon.Heading2Icon,
  },
  {
    label: 'Heading 3',
    headingType: 'h3',
    icon: Icon.Heading3Icon,
  },
];

type ListBtnConfig = ComponentProps<typeof ListBtn>;

export const listBtns: ListBtnConfig[] = [
  {
    label: 'Bullet List',
    listType: 'bullet',
    icon: Icon.ListIcon,
  },
  {
    label: 'Numbered List',
    listType: 'number',
    icon: Icon.ListOrderedIcon,
  },
];
