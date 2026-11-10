import { FCProps } from '@/types/fcProps.type';
import { CheckIcon } from 'lucide-react';
import { useRef } from 'react';
import { ClickableIcon } from '../../../../../../../ClickableIcon/ClickableIcon';
import { Input } from '../../../../../../../Input/Input';
import './LinkInput.css';

type Props = {
  value: string;
  onChange: (value: string) => void;
  disabled: boolean;
  isApplyEnabled: boolean;
  onApply: () => void;
};

export const LinkInput: FCProps<Props> = ({
  value,
  onChange,
  disabled,
  isApplyEnabled,
  onApply,
}) => {
  const inputRef = useRef<HTMLInputElement | null>(null);

  const onInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onChange(e.target.value);
  };

  const onInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') onApply();
  };

  return (
    <div className='link-input'>
      <Input
        ref={inputRef}
        value={value}
        onChange={onInputChange}
        disabled={disabled}
        placeholder='https://...'
        onKeyDown={onInputKeyDown}
        className='link-input--input'
      />

      <ClickableIcon
        icon={<CheckIcon />}
        onClick={onApply}
        disabled={!isApplyEnabled}
        label='Apply link'
        className='link-input--icon content-center'
      />
    </div>
  );
};
