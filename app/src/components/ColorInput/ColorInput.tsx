import { useEffect, useRef } from 'react';
import { FCProps } from '@/types';
import { hexToRgb, rgbToHex } from './helper';
import './ColorInput.css';

type Props = { value: string; onChange: (value: string) => void };

export const ColorInput: FCProps<Props> = ({ value, onChange }) => {
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.setAttribute('color-space', 'display-p3');
  }, []);

  return (
    <label className='color-input-wrapper'>
      <input
        ref={inputRef}
        type='color'
        className='color-input-hidden'
        value={rgbToHex(value)}
        onChange={(e) => { onChange(hexToRgb(e.target.value)); }}
      />
      <span
        className='color-input-dot'
        style={{ '--rt-color-input-color': value } as React.CSSProperties}
      />
    </label>
  );
};
