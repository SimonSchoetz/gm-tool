import { FCProps } from '@/types';
import { CheckIcon } from 'lucide-react';
import { useEffect, useRef } from 'react';
import { ClickableIcon } from '../../../../../ClickableIcon/ClickableIcon';
import { Input } from '../../../../../Input/Input';
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

  useEffect(() => {
    if (!disabled) {
      inputRef.current?.focus();
    }
  }, [disabled]);

  return (
    <div className='link-input'>
      <Input
        ref={inputRef}
        value={value}
        onChange={(e) => { onChange(e.target.value); }}
        disabled={disabled}
        placeholder='https://...'
        onKeyDown={(e) => {
          if (e.key === 'Enter') onApply();
        }}
      />
      <ClickableIcon
        icon={<CheckIcon />}
        onClick={onApply}
        disabled={!isApplyEnabled}
        label='Apply link'
      />
    </div>
  );
};
