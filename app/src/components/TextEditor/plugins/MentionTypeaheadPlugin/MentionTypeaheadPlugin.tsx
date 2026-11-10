import { useCallback, useRef, useState } from 'react';
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import {
  LexicalTypeaheadMenuPlugin,
  useBasicTypeaheadTriggerMatch,
} from '@lexical/react/LexicalTypeaheadMenuPlugin';
import { TextNode } from 'lexical';
import { useParams } from '@tanstack/react-router';
import { useTableConfigs } from '@/data-access-layer';
import * as mentionSearchService from '@services/mentionSearchService';
import { MentionNode } from '../../nodes/MentionNode';
import './MentionTypeaheadPlugin.css';
import { GlassPanel } from '../../../GlassPanel/GlassPanel';
import { AnchoredPopup } from '../../../AnchoredPopup';
import { getSelectionRangeRect } from '../../helper/getSelectionRangeRect';
import { MentionMenuOption } from './mentionMenuOption';
import { MentionOptionList } from './components/MentionOptionList/MentionOptionList';

export const MentionTypeaheadPlugin = () => {
  const [editor] = useLexicalComposerContext();
  const { adventureId = '' } = useParams({ strict: false });
  const { tableConfigs } = useTableConfigs();
  const [options, setOptions] = useState<MentionMenuOption[]>([]);

  const triggerFn = useBasicTypeaheadTriggerMatch('@', { minLength: 0 });
  const queryGenerationRef = useRef(0);

  // Consumer: LexicalTypeaheadMenuPlugin lists `onQueryChange` in the dependency array of its editor-update effect (`.claude/knowledge/lexical.md`).
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

  // Consumer: LexicalMenu lists `onSelectOption` in the dependencies of `selectOptionAndCleanUp`, which its key-handler effect lists (`.claude/knowledge/lexical.md`).
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
          option.result.adventureId,
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

  const menuRenderFn = (
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

    const getAnchorRect = () => getSelectionRangeRect(editor);

    return (
      <AnchoredPopup getAnchorRect={getAnchorRect}>
        <GlassPanel className='mention-typeahead-popup'>
          <MentionOptionList
            menuOptions={menuOptions}
            selectedIndex={selectedIndex}
            selectOptionAndCleanUp={selectOptionAndCleanUp}
            setHighlightedIndex={setHighlightedIndex}
          />
        </GlassPanel>
      </AnchoredPopup>
    );
  };

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
