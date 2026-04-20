import { useCallback, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import {
  LexicalTypeaheadMenuPlugin,
  MenuOption,
  useBasicTypeaheadTriggerMatch,
} from '@lexical/react/LexicalTypeaheadMenuPlugin';
import { TextNode } from 'lexical';
import { useParams } from '@tanstack/react-router';
import { useTableConfigs } from '@/data-access-layer';
import * as mentionSearchService from '@/services/mentionSearchService';
import type { MentionSearchResult } from '@/services/mentionSearchService';
import { MentionNode } from '../nodes';
import { formatTableLabel } from '@/util';
import './MentionTypeaheadPlugin.css';
import { CustomScrollArea, GlassPanel } from '@/components';

class MentionMenuOption extends MenuOption {
  result: MentionSearchResult;

  constructor(result: MentionSearchResult) {
    super(result.id);
    this.result = result;
  }
}

export const MentionTypeaheadPlugin = () => {
  const [editor] = useLexicalComposerContext();
  const { adventureId = '' } = useParams({ strict: false });
  const { tableConfigs } = useTableConfigs();
  const [options, setOptions] = useState<MentionMenuOption[]>([]);

  const triggerFn = useBasicTypeaheadTriggerMatch('@', { minLength: 0 });
  const queryGenerationRef = useRef(0);

  const onQueryChange = useCallback(
    (matchingString: string | null) => {
      if (matchingString === null) {
        setOptions([]);
        return;
      }
      const generation = ++queryGenerationRef.current;
      mentionSearchService
        .searchMentions(matchingString, adventureId, tableConfigs)
        .then((results) => {
          if (generation === queryGenerationRef.current) {
            setOptions(results.map((r) => new MentionMenuOption(r)));
          }
        })
        .catch(() => {
          if (generation === queryGenerationRef.current) {
            setOptions([]);
          }
        });
    },
    [adventureId, tableConfigs],
  );

  const onSelectOption = useCallback(
    (
      option: MentionMenuOption,
      textNodeContainingQuery: TextNode | null,
      closeMenu: () => void,
    ) => {
      editor.update(() => {
        const mentionNode = new MentionNode(
          option.result.id,
          option.result.tableName,
          option.result.name,
          option.result.color,
          option.result.adventureId ?? null,
        );
        if (textNodeContainingQuery !== null) {
          textNodeContainingQuery.replace(mentionNode);
        }
        mentionNode.selectNext(0, 0);
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
        options: MentionMenuOption[];
        selectedIndex: number | null;
        selectOptionAndCleanUp: (option: MentionMenuOption) => void;
        setHighlightedIndex: (index: number) => void;
      },
    ) => {
      if (anchorElementRef.current === null || menuOptions.length === 0) {
        return null;
      }

      return createPortal(
        <GlassPanel className='mention-typeahead-popup'>
          <CustomScrollArea className='mention-typeahead-content-container'>
            <ul>
              {menuOptions.map((option, i) => (
                <li
                  key={option.key}
                  ref={(el) => {
                    option.setRefElement(el);
                  }}
                  className={`mention-typeahead-item${i === selectedIndex ? ' mention-typeahead-item--selected' : ''}`}
                  onClick={() => {
                    selectOptionAndCleanUp(option);
                  }}
                  onMouseEnter={() => {
                    setHighlightedIndex(i);
                  }}
                  style={{ color: option.result.color }}
                >
                  <span className='mention-typeahead-item-name'>
                    {option.result.name}
                  </span>
                  <span className='mention-typeahead-item-table-label'>
                    {formatTableLabel(option.result.tableName)}
                  </span>
                </li>
              ))}
            </ul>
          </CustomScrollArea>
        </GlassPanel>,
        anchorElementRef.current,
      );
    },
    [],
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
