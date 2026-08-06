import { useCallback, useMemo, useState } from 'react';
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import {
  LexicalTypeaheadMenuPlugin,
  useBasicTypeaheadTriggerMatch,
} from '@lexical/react/LexicalTypeaheadMenuPlugin';
import { $getSelection, $isRangeSelection, TextNode } from 'lexical';
import './SlashCommandPlugin.css';
import { AnchoredPopup } from '../../../AnchoredPopup';
import { PopupSurface } from '../../../PopupSurface/PopupSurface';
import { CustomScrollArea } from '../../../../components/CustomScrollArea/CustomScrollArea';
import { getSelectionRangeRect, resolveTopLevelBlock } from '../../helper';
import {
  SLASH_COMMAND_OPTIONS,
  SlashCommandOption,
} from './slashCommandOptions';
import { SlashCommandOptionList } from './components';

export const SlashCommandPlugin = () => {
  const [editor] = useLexicalComposerContext();
  const [query, setQuery] = useState<string | null>(null);

  const triggerFn = useBasicTypeaheadTriggerMatch('/', {
    minLength: 0,
    allowWhitespace: false,
  });

  const onQueryChange = useCallback((matchingString: string | null) => {
    setQuery(matchingString);
  }, []);

  const options = useMemo(() => {
    if (query === null) {
      return [];
    }
    const lowerQuery = query.toLowerCase();
    return SLASH_COMMAND_OPTIONS.filter((option) =>
      option.label.toLowerCase().includes(lowerQuery),
    );
  }, [query]);

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
        selectedIndex,
        selectOptionAndCleanUp,
        setHighlightedIndex,
      }: {
        options: SlashCommandOption[];
        selectedIndex: number | null;
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
          const element = resolveTopLevelBlock(anchorNode);
          activeOptionKeys = new Set(
            menuOptions
              .filter((option) => option.isActive(element))
              .map((option) => option.key),
          );
        }
      });

      return (
        <AnchoredPopup getAnchorRect={() => getSelectionRangeRect(editor)}>
          <PopupSurface>
            <CustomScrollArea className='slash-command-scroll-area'>
              <SlashCommandOptionList
                menuOptions={menuOptions}
                selectedIndex={selectedIndex}
                activeOptionKeys={activeOptionKeys}
                selectOptionAndCleanUp={selectOptionAndCleanUp}
                setHighlightedIndex={setHighlightedIndex}
              />
            </CustomScrollArea>
          </PopupSurface>
        </AnchoredPopup>
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
