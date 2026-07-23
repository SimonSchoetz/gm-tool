import { FCProps } from '@/types';
import { useSyncedInputValue } from '@/hooks';
import { Input } from '../Input/Input';

type Props = {
  initValue: string;
  onCommit: (value: string) => void;
} & Omit<
  React.ComponentProps<typeof Input>,
  'value' | 'onChange' | 'onFocus' | 'onBlur' | 'defaultValue'
>;

// A text Input that owns its display state so local typing stays jank-free, while still adopting an external value change (a synced edit from a paired device) once the field is not being edited. initValue is the source-of-truth value (typically a query result); onCommit fires per keystroke with the new value for the caller to persist.
export const SyncedInput: FCProps<Props> = ({
  initValue,
  onCommit,
  ...props
}) => {
  const { value, setValue, focusProps } = useSyncedInputValue(initValue);

  return (
    <Input
      {...props}
      value={value}
      onChange={(e) => {
        setValue(e.target.value);
        onCommit(e.target.value);
      }}
      {...focusProps}
    />
  );
};
