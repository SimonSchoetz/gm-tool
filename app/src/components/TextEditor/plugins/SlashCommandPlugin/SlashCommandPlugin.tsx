import { Fragment, useCallback, useState } from 'react';
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import {
  LexicalTypeaheadMenuPlugin,
  useBasicTypeaheadTriggerMatch,
} from '@lexical/react/LexicalTypeaheadMenuPlugin';
import { $getSelection, $isRangeSelection, TextNode } from 'lexical';
import { cn } from '@/util';
import './SlashCommandPlugin.css';
import { GlassPanel } from '../../../GlassPanel/GlassPanel';
import { EditorPopup } from '../../components/EditorPopup';
import { CustomScrollArea } from '@/components/CustomScrollArea/CustomScrollArea';
import { getSelectionRangeRect } from '../../helper';
import {
  SLASH_COMMAND_OPTIONS,
  SlashCommandOption,
} from './slashCommandOptions';

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
                          i === selectedIndex && 'slash-command-item--selected',
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
