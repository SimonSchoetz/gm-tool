import { Fragment, useCallback, useState } from 'react';
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import {
  LexicalTypeaheadMenuPlugin,
  MenuOption,
  useBasicTypeaheadTriggerMatch,
} from '@lexical/react/LexicalTypeaheadMenuPlugin';
import {
  $getSelection,
  $isRangeSelection,
  LexicalEditor,
  LexicalNode,
  TextNode,
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
import { cn } from '@/util';
import './SlashCommandPlugin.css';
import { GlassPanel } from '../../../GlassPanel/GlassPanel';
import { EditorPopup } from '../../components/EditorPopup';
import { CustomScrollArea } from '@/components/CustomScrollArea/CustomScrollArea';
import { getSelectionRangeRect } from '../../helper';

class SlashCommandOption extends MenuOption {
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

const SLASH_COMMAND_OPTIONS: SlashCommandOption[] = [
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

export const SlashCommandPlugin = () => {
  const [editor] = useLexicalComposerContext();
  const [options, setOptions] = useState<SlashCommandOption[]>(
    SLASH_COMMAND_OPTIONS,
  );

  const triggerFn = useBasicTypeaheadTriggerMatch('/', {
    minLength: 0,
    allowWhitespace: false,
  });

  const onQueryChange = useCallback((matchingString: string | null) => {
    if (matchingString === null) {
      setOptions([]);
      return;
    }
    const query = matchingString.toLowerCase();
    setOptions(
      SLASH_COMMAND_OPTIONS.filter((option) =>
        option.label.toLowerCase().includes(query),
      ),
    );
  }, []);

  const onSelectOption = useCallback(
    (
      option: SlashCommandOption,
      textNodeContainingQuery: TextNode | null,
      closeMenu: () => void,
    ) => {
      editor.update(() => {
        textNodeContainingQuery?.remove();
        option.onSelect(editor);
      });
      closeMenu();
    },
    [editor],
  );

  const menuRenderFn = useCallback(
    (
      anchorElementRef: React.RefObject<HTMLElement | null>,
      {
        options: menuOptions,
        selectOptionAndCleanUp,
        setHighlightedIndex,
      }: {
        options: SlashCommandOption[];
        selectOptionAndCleanUp: (option: SlashCommandOption) => void;
        setHighlightedIndex: (index: number) => void;
      },
    ) => {
      if (anchorElementRef.current === null || menuOptions.length === 0) {
        return null;
      }

      let activeOptionKeys = new Set<string>();
      editor.getEditorState().read(() => {
        const selection = $getSelection();
        if ($isRangeSelection(selection)) {
          const anchorNode = selection.anchor.getNode();
          const element =
            anchorNode.getKey() === 'root'
              ? anchorNode
              : anchorNode.getTopLevelElementOrThrow();
          activeOptionKeys = new Set(
            menuOptions
              .filter((option) => option.isActive(element))
              .map((option) => option.key),
          );
        }
      });

      return (
        <EditorPopup getAnchorRect={() => getSelectionRangeRect(editor)}>
          <GlassPanel className='slash-command-popup-container'>
            <CustomScrollArea childrenContainerClassName='slash-command-popup-list'>
              <ul>
                {menuOptions.map((option, i) => {
                  const Icon = option.Icon;
                  const isNewSection =
                    i === 0 || menuOptions[i - 1].section !== option.section;
                  const isActive = activeOptionKeys.has(option.key);
                  return (
                    <Fragment key={option.key}>
                      {isNewSection && (
                        <li className='slash-command-section-heading'>
                          {option.section}
                        </li>
                      )}

                      <li
                        ref={(el) => {
                          option.setRefElement(el);
                        }}
                        className={cn(
                          'slash-command-item',
                          isActive && 'slash-command-item--active',
                        )}
                        onClick={() => {
                          selectOptionAndCleanUp(option);
                        }}
                        onMouseEnter={() => {
                          setHighlightedIndex(i);
                        }}
                      >
                        <GlassPanel
                          className='slash-command-icon-container'
                          intensity={isActive ? 'bright' : 'dim'}
                        >
                          <Icon />
                        </GlassPanel>
                        <span className='slash-command-item-label'>
                          {option.label}
                        </span>
                      </li>
                    </Fragment>
                  );
                })}
              </ul>
            </CustomScrollArea>
          </GlassPanel>
        </EditorPopup>
      );
    },
    [editor],
  );

  return (
    <LexicalTypeaheadMenuPlugin
      options={options}
      onQueryChange={onQueryChange}
      onSelectOption={onSelectOption}
      menuRenderFn={menuRenderFn}
      triggerFn={triggerFn}
    />
  );
};
