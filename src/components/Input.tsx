'use client';

import { DetailedHTMLProps, InputHTMLAttributes, useState } from 'react';
import { ConditionWrapper } from './wrapper';

export type InputProps = DetailedHTMLProps<
  InputHTMLAttributes<HTMLInputElement>,
  HTMLInputElement
> & {
  label?: string;
  validationError?: string;
};

const Input = ({ label, validationError, ...inputProps }: InputProps) => {
  const [focused, setFocused] = useState(false);

  const labelColor = focused ? 'text-slate-950' : 'text-slate-600';

  return (
    <>
      <ConditionWrapper condition={!!label}>
        <label className={`ml-2 ${labelColor}`}>{label}</label>
      </ConditionWrapper>
      <input
        {...inputProps}
        className='border border-slate-400 rounded-lg px-2 py-1 w-full outline-slate-950'
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
      />
    </>
  );
};

export default Input;
