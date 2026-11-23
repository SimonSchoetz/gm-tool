import { useEffect } from 'react';
import { FCProps } from '@/types/fcProps.type';
import { cn } from '@/util/className';
import { entityTypeLabel } from '@domain';
import { MentionMenuOption } from '../../mentionMenuOption';
import './MentionOptionList.css';

type Props = {
  menuOptions: MentionMenuOption[];
  selectedIndex: number | null;
  selectOptionAndCleanUp: (option: MentionMenuOption) => void;
  setHighlightedIndex: (index: number) => void;
};

export const MentionOptionList: FCProps<Props> = ({
  menuOptions,
  selectedIndex,
  selectOptionAndCleanUp,
  setHighlightedIndex,
}) => {
  useEffect(() => {
    if (selectedIndex === null) return;
    menuOptions[selectedIndex]?.ref?.current?.scrollIntoView({
      block: 'nearest',
    });
  }, [selectedIndex, menuOptions]);

  return (
    <ul
      className='mention-option-list scroll-edge-fade scroll-edge-fade--sm scroll-edge-fade--no-top scroll-edge-fade--no-bottom'
      role='listbox'
    >
      {menuOptions.map((option, i) => (
        <li
          key={option.key}
          role='option'
          aria-selected={i === selectedIndex}
          ref={(el) => {
            option.setRefElement(el);
          }}
          className={cn(
            'mention-option-list-item',
            i === selectedIndex && 'mention-option-list-item--selected',
          )}
          onClick={() => {
            selectOptionAndCleanUp(option);
          }}
          onMouseEnter={() => {
            setHighlightedIndex(i);
          }}
          style={
            {
              '--rt-mention-option-list-item-color': option.result.color,
            } as React.CSSProperties
          }
        >
          <span className='clip-text'>{option.result.name}</span>
          <span className='mention-option-list-item-table-label'>
            {entityTypeLabel(option.result.tableName)}
          </span>
        </li>
      ))}
    </ul>
  );
};
