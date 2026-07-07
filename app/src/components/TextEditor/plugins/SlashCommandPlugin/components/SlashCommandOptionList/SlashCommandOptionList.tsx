import { Fragment, useEffect } from 'react';
import { FCProps } from '@/types';
import { cn } from '@/util';
import { GlassPanel } from '../../../../../GlassPanel/GlassPanel';
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
    <ul>
      {menuOptions.map((option, i) => {
        const Icon = option.Icon;
        const isNewSection =
          i === 0 || menuOptions[i - 1].section !== option.section;
        const isActive = activeOptionKeys.has(option.key);
        return (
          <Fragment key={option.key}>
            {isNewSection && (
              <li className='slash-command-option-list-section-heading'>
                {option.section}
              </li>
            )}

            <li
              ref={(el) => {
                option.setRefElement(el);
              }}
              className={cn('TEP--li', isActive && 'TEP--li--active')}
              onClick={() => {
                selectOptionAndCleanUp(option);
              }}
              onMouseEnter={() => {
                setHighlightedIndex(i);
              }}
            >
              <GlassPanel
                className='TEP--li-icon-container'
                intensity={isActive ? 'bright' : 'dim'}
              >
                <Icon />
              </GlassPanel>
              <span className='slash-command-option-list-item-label'>
                {option.label}
              </span>
            </li>
          </Fragment>
        );
      })}
    </ul>
  );
};
