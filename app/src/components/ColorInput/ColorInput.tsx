import { useEffect, useRef } from 'react';
import { FCProps } from '@/types/fcProps.type';
import { hexToRgb } from './helper/hexToRgb';
import { rgbToHex } from './helper/rgbToHex';
import './ColorInput.css';

type Props = {
  label: string;
  value: string;
  onChange: (value: string) => void;
};

export const ColorInput: FCProps<Props> = ({ label, value, onChange }) => {
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.setAttribute('color-space', 'display-p3');
  }, []);

  const hexValue = rgbToHex(value);

  const onInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onChange(hexToRgb(e.target.value));
  };

  return (
    <label
      className='color-input-wrapper'
      style={{ '--rt-color-input-color': value } as React.CSSProperties}
    >
      <input
        ref={inputRef}
        type='color'
        className='color-input-hidden'
        value={hexValue}
        onChange={onInputChange}
      />
      <span className='color-input-label'>{label}</span>
    </label>
  );
};
