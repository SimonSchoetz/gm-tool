'use client';

import { HTMLInputTypeAttribute, use, useState } from 'react';

export type InputProps = {
  value: string;
  onValueChange: (value: string) => any;
  type?: HTMLInputTypeAttribute;
  placeholder?: string;
  label?: string;
  name?: string;
};

const Input = ({
  type = 'text',
  value,
  onValueChange,
  placeholder,
  label,
  name,
}: InputProps) => {
  const [focused, setFocused] = useState(false);

  const labelColor = focused ? 'text-slate-950' : 'text-slate-600';

  return (
    <div>
      {label ? <label className={`ml-2 ${labelColor}`}>{label}</label> : null}
      <input
        type={type}
        value={value}
        onChange={({ target }) => onValueChange(target.value)}
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
