import { useState } from 'react';
import { Input } from '@/components/Input/Input';
import { useSyncedInputValue } from '@/hooks/useSyncedInputValue';
import { FCProps } from '@/types/fcProps.type';
import type { FiveEStatBlockNumberKey } from '@domain';
import { readSaveableWholeNumber } from '../../../../helper/readSaveableWholeNumber';
import type { FiveEStatBlockGroupProps } from '../../types';

type Props = {
  saveField: FiveEStatBlockGroupProps['saveField'];
  field: FiveEStatBlockNumberKey;
  placeholder: string;
  savedValue: number | null;
  readOnly: boolean;
};

export const FiveEStatBlockNumberField: FCProps<Props> = ({
  saveField,
  field,
  placeholder,
  savedValue,
  readOnly,
}) => {
  const savedText = savedValue === null ? '' : String(savedValue);
  const { value, setValue, focusProps } = useSyncedInputValue(savedText);
  const [inputRevision, setInputRevision] = useState(0);

  return (
    <Input
      className='number-input'
      // Remounted on every revert: React rewrites a number input's text only when its DOM value differs from the bound value, and unconvertible text already reads `''`, so a revert to an empty value would otherwise leave `-` or `1.` on screen.
      key={inputRevision}
      type='number'
      value={value}
      onChange={(event) => {
        setValue(event.currentTarget.value);
        // Saves and reverts go through `readSaveableWholeNumber`, never `parseWholeNumberInput(value)` alone: a number input holding text it cannot convert (`1.` while typing `1.5`, a lone `-`) reports `value` as `''`, and reading that as a cleared field would save an empty value.
        const input = readSaveableWholeNumber(event.currentTarget);
        if (!input.valid) return;
        saveField(field, input.value);
      }}
      onFocus={focusProps.onFocus}
      onBlur={(event) => {
        focusProps.onBlur();
        if (readSaveableWholeNumber(event.currentTarget).valid) return;
        setValue(savedText);
        setInputRevision((revision) => revision + 1);
      }}
      readOnly={readOnly}
      placeholder={readOnly ? undefined : placeholder}
    />
  );
};
