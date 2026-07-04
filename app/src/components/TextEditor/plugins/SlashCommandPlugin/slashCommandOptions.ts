import { MenuOption } from '@lexical/react/LexicalTypeaheadMenuPlugin';
import {
  $getSelection,
  $isRangeSelection,
  LexicalEditor,
  LexicalNode,
} from 'lexical';

import { $setBlocksType } from '@lexical/selection';
import { $createHeadingNode, $isHeadingNode } from '@lexical/rich-text';
import {
  $isListNode,
  INSERT_CHECK_LIST_COMMAND,
  INSERT_ORDERED_LIST_COMMAND,
  INSERT_UNORDERED_LIST_COMMAND,
} from '@lexical/list';
import { INSERT_TABLE_COMMAND } from '@lexical/table';
import {
  Heading1Icon,
  Heading2Icon,
  Heading3Icon,
  ListIcon,
  ListChecksIcon,
  ListOrderedIcon,
  LucideIcon,
  TableIcon,
} from 'lucide-react';

export class SlashCommandOption extends MenuOption {
  label: string;
  Icon: LucideIcon;
  section: string;
  onSelect: (editor: LexicalEditor) => void;
  isActive: (element: LexicalNode) => boolean;

  constructor(
    label: string,
    Icon: LucideIcon,
    section: string,
    onSelect: (editor: LexicalEditor) => void,
    isActive: (element: LexicalNode) => boolean,
  ) {
    super(label);
    this.label = label;
    this.Icon = Icon;
    this.section = section;
    this.onSelect = onSelect;
    this.isActive = isActive;
  }
}

export const SLASH_COMMAND_OPTIONS: SlashCommandOption[] = [
  new SlashCommandOption(
    'Heading 1',
    Heading1Icon,
    'Text',
    (editor) => {
      editor.update(() => {
        const selection = $getSelection();
        if ($isRangeSelection(selection)) {
          $setBlocksType(selection, () => $createHeadingNode('h1'));
        }
      });
    },
    (element) => $isHeadingNode(element) && element.getTag() === 'h1',
  ),
  new SlashCommandOption(
    'Heading 2',
    Heading2Icon,
    'Text',
    (editor) => {
      editor.update(() => {
        const selection = $getSelection();
        if ($isRangeSelection(selection)) {
          $setBlocksType(selection, () => $createHeadingNode('h2'));
        }
      });
    },
    (element) => $isHeadingNode(element) && element.getTag() === 'h2',
  ),
  new SlashCommandOption(
    'Heading 3',
    Heading3Icon,
    'Text',
    (editor) => {
      editor.update(() => {
        const selection = $getSelection();
        if ($isRangeSelection(selection)) {
          $setBlocksType(selection, () => $createHeadingNode('h3'));
        }
      });
    },
    (element) => $isHeadingNode(element) && element.getTag() === 'h3',
  ),
  new SlashCommandOption(
    'Bullet list',
    ListIcon,
    'List',
    (editor) => {
      editor.dispatchCommand(INSERT_UNORDERED_LIST_COMMAND, undefined);
    },
    (element) => $isListNode(element) && element.getListType() === 'bullet',
  ),
  new SlashCommandOption(
    'Numbered list',
    ListOrderedIcon,
    'List',
    (editor) => {
      editor.dispatchCommand(INSERT_ORDERED_LIST_COMMAND, undefined);
    },
    (element) => $isListNode(element) && element.getListType() === 'number',
  ),
  new SlashCommandOption(
    'Checklist',
    ListChecksIcon,
    'List',
    (editor) => {
      editor.dispatchCommand(INSERT_CHECK_LIST_COMMAND, undefined);
    },
    (element) => $isListNode(element) && element.getListType() === 'check',
  ),
  new SlashCommandOption(
    'Table',
    TableIcon,
    'Table',
    (editor) => {
      editor.dispatchCommand(INSERT_TABLE_COMMAND, {
        columns: '3',
        rows: '3',
      });
    },
    () => false,
  ),
];
