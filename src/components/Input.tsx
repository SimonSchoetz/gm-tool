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

  const labelColorFocused = validationError ? 'text-red-600' : 'text-slate-950';

  const labelColorNotFocused = validationError
    ? 'text-red-500'
    : 'text-slate-600';

  const labelColor = focused ? labelColorFocused : labelColorNotFocused;

  const borderColor = validationError ? 'border-red-500' : 'border-slate-400';

  const outlineColor = validationError
    ? 'outline-red-600'
    : 'outline-slate-950';

  const errorMessageColor = focused ? 'text-red-600' : 'text-red-500';

  return (
    <>
      <ConditionWrapper condition={!!label}>
        <label className={`ml-2 ${labelColor}`}>{label}</label>
      </ConditionWrapper>
      <input
        {...inputProps}
        className={`border ${borderColor} rounded-lg px-2 py-1 w-full ${outlineColor}`}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        aria-invalid={!!validationError}
        aria-errormessage={validationError}
      />
      <ConditionWrapper condition={!!validationError}>
        <p className={`ml-2 ${errorMessageColor}`}>{validationError}</p>
      </ConditionWrapper>
    </>
  );
};

export default Input;
