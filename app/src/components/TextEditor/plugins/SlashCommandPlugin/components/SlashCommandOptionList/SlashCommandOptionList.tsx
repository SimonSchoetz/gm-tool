import { Fragment, useEffect } from 'react';
import { FCProps } from '@/types';
import { MenuOptionRow } from '../../../../../MenuOptionRow';
import { SlashCommandOption } from '../../slashCommandOptions';
import './SlashCommandOptionList.css';

type Props = {
  menuOptions: SlashCommandOption[];
  selectedIndex: number | null;
  activeOptionKeys: Set<string>;
  selectOptionAndCleanUp: (option: SlashCommandOption) => void;
  setHighlightedIndex: (index: number) => void;
};

export const SlashCommandOptionList: FCProps<Props> = ({
  menuOptions,
  selectedIndex,
  activeOptionKeys,
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
    <ul className='slash-command-option-list'>
      {menuOptions.map((option, i) => {
        const isNewSection =
          i === 0 || menuOptions[i - 1].section !== option.section;
        const isActive = activeOptionKeys.has(option.key);
        return (
          <Fragment key={option.key}>
            {isNewSection && (
              <li className='slash-command-option-list-section-heading label'>
                {option.section}
              </li>
            )}

            <li
              ref={(el) => {
                option.setRefElement(el);
              }}
            >
              <MenuOptionRow
                Icon={option.Icon}
                label={option.label}
                isActive={isActive}
                isSelected={i === selectedIndex}
                onClick={() => {
                  selectOptionAndCleanUp(option);
                }}
                onMouseEnter={() => {
                  setHighlightedIndex(i);
                }}
              />
            </li>
          </Fragment>
        );
      })}
    </ul>
  );
};
