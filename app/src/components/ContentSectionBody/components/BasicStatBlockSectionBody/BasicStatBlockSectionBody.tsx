import { useState } from 'react';
import type { CSSProperties } from 'react';
import { useBaseEntityContentSections } from '@/data-access-layer';
import { useSyncedInputValue } from '@/hooks/useSyncedInputValue';
import { Input } from '@/components/Input/Input';
import { TEXT_EDITOR_GUTTER_WIDTH, TextEditor } from '@/components/TextEditor';
import { FCProps } from '@/types/fcProps.type';
import { cn } from '@/util/className';
import {
  BASIC_STAT_BLOCK_HP_LABEL,
  parseBasicStatBlockContent,
  patchBasicStatBlockContent,
} from '@domain';
import { CONTENT_SECTION_EDITOR_PLACEHOLDER } from '../../ContentSectionBody.constants';
import type { SectionBodyProps } from '../../types';
import { readSaveableHp } from './helper/readSaveableHp';
import './BasicStatBlockSectionBody.css';

type Props = SectionBodyProps;

export const BasicStatBlockSectionBody: FCProps<Props> = ({
  section,
  baseEntityId,
  readOnly,
}) => {
  // HP and text both rewrite the whole `content`, so every write composes against the cached section through `updateSectionContent`, never against the rendered `section`, which lags a cache write by a task — an HP edit would otherwise be overwritten by the editor's next save.
  const { updateSectionContent } = useBaseEntityContentSections(baseEntityId);
  const content = parseBasicStatBlockContent(section.content);
  const savedHp = content.basicStatBlock.hp;
  const savedHpText = savedHp === null ? '' : String(savedHp);

  const {
    value: hpText,
    setValue: setHpText,
    focusProps,
  } = useSyncedInputValue(savedHpText);
  const [hpInputRevision, setHpInputRevision] = useState(0);

  const textEditorId = `basic-stat-block-${section.id}-${readOnly ? 'read' : 'edit'}`;

  return (
    <div
      className='basic-stat-block-section-body'
      style={
        {
          '--basic-stat-block-section-body-gutter-width':
            TEXT_EDITOR_GUTTER_WIDTH,
        } as CSSProperties
      }
    >
      <label
        className={cn(
          'basic-stat-block-section-body-hp',
          !readOnly && 'basic-stat-block-section-body-hp--editable',
        )}
      >
        <span className='label'>{BASIC_STAT_BLOCK_HP_LABEL}</span>
        <Input
          className='basic-stat-block-section-body-hp-input'
          // Remounted on every revert: React rewrites a number input's text only when its DOM value differs from the bound value, and unconvertible text already reads `''`, so a revert to an empty HP would otherwise leave `-` or `1.` on screen.
          key={hpInputRevision}
          type='number'
          value={hpText}
          onChange={(event) => {
            setHpText(event.currentTarget.value);
            // Saves and reverts go through `readSaveableHp`, never `parseBasicStatBlockHpInput(value)` alone: a number input holding text it cannot convert (`1.` while typing `1.5`, a lone `-`) reports `value` as `''`, and reading that as a cleared field would save an empty HP.
            const hpInput = readSaveableHp(event.currentTarget);
            if (!hpInput.valid) return;
            const { hp } = hpInput;
            updateSectionContent(section.id, (current) =>
              patchBasicStatBlockContent(current, { hp }),
            );
          }}
          onFocus={focusProps.onFocus}
          onBlur={(event) => {
            focusProps.onBlur();
            if (readSaveableHp(event.currentTarget).valid) return;
            setHpText(savedHpText);
            setHpInputRevision((revision) => revision + 1);
          }}
          readOnly={readOnly}
        />
      </label>
      <TextEditor
        textEditorId={textEditorId}
        value={content.textEditor}
        placeholder={CONTENT_SECTION_EDITOR_PLACEHOLDER}
        readOnly={readOnly}
        // Passed only when editable: OnChangePlugin mounts whenever onChange is passed and fires on selection-only updates, and CheckboxReadOnlyPlugin toggles checklist items in a read-only editor, so a passed onChange would save a popup checkbox tick.
        {...(!readOnly && {
          onChange: (textEditor: string) => {
            updateSectionContent(section.id, (current) =>
              patchBasicStatBlockContent(current, { textEditor }),
            );
          },
        })}
      />
    </div>
  );
};
