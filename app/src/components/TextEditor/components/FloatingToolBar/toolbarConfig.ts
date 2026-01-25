import * as Icon from 'lucide-react';
import { ComponentProps } from 'react';
import { TextFormatBtn, HeadingBtn } from './components';

type TextFormatBtnConfig = ComponentProps<typeof TextFormatBtn>;

type HeadingBtnConfig = ComponentProps<typeof HeadingBtn>;

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
