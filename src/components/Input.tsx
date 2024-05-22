'use client';

import { DetailedHTMLProps, InputHTMLAttributes, useState } from 'react';

export type InputProps = DetailedHTMLProps<
  InputHTMLAttributes<HTMLInputElement>,
  HTMLInputElement
> & {
  label?: string;
};

const Input = ({ label, ...inputProps }: InputProps) => {
  const [focused, setFocused] = useState(false);

  const labelColor = focused ? 'text-slate-950' : 'text-slate-600';

  return (
    <div>
      {label ? <label className={`ml-2 ${labelColor}`}>{label}</label> : null}
      <input
        {...inputProps}
        className='border border-slate-400 rounded-lg px-2 py-1 w-full outline-slate-950'
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
      />
    </div>
  );
};

export default Input;
