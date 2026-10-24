import { SyncedInput } from '@/components/SyncedInput/SyncedInput';
import { FCProps } from '@/types/fcProps.type';
import type { FiveEStatBlockTextKey } from '@domain';
import type { FiveEStatBlockGroupProps } from '../../types';

type Props = {
  saveField: FiveEStatBlockGroupProps['saveField'];
  field: FiveEStatBlockTextKey;
  label: string;
  placeholder: string;
  savedValue: string;
  readOnly: boolean;
  className?: string;
};

export const FiveEStatBlockTextField: FCProps<Props> = ({
  saveField,
  field,
  label,
  placeholder,
  savedValue,
  readOnly,
  className,
}) => {
  if (readOnly && savedValue.trim() === '') return null;

  return (
    <label className={className}>
      <span className='label'>{label}</span>
      <SyncedInput
        initValue={savedValue}
        onCommit={(text) => {
          saveField(field, text);
        }}
        readOnly={readOnly}
        placeholder={placeholder}
      />
    </label>
  );
};
