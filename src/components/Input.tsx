'use client';

import { SetAction } from '@/app/types';
import { HTMLInputTypeAttribute, useState } from 'react';

type Props = {
  type: HTMLInputTypeAttribute;
  value: string;
  setValue: SetAction<string>;
  placeholder?: string;
  label?: string;
  name?: string;
};

const Input = ({
  type = 'text',
  value,
  setValue,
  placeholder,
  label,
  name,
}: Props) => {
  const [focused, setFocused] = useState(false);

  const labelColor = focused ? 'text-slate-950' : 'text-slate-600';

  return (
    <div>
      {label ? <label className={`ml-2 ${labelColor}`}>{label}</label> : null}
      <input
        type={type}
        value={value}
        onChange={({ target }) => setValue(target.value)}
        className='border border-slate-400 rounded-lg px-2 py-1 w-full outline-slate-950'
        placeholder={placeholder}
        name={name}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
      />
    </div>
  );
};

export default Input;
