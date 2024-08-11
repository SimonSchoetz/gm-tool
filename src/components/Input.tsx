'use client';

import { DetailedHTMLProps, InputHTMLAttributes, useState } from 'react';
import { ConditionWrapper } from './wrapper';
import { InputLabelUnderline } from './animations';

export type InputProps = DetailedHTMLProps<
  InputHTMLAttributes<HTMLInputElement>,
  HTMLInputElement
> & {
  label?: string;
  validationError?: string;
};

const Input = ({ label, validationError, ...inputProps }: InputProps) => {
  const [focused, setFocused] = useState(false);

  const borderColor = validationError ? 'border-red-500' : '';

  const outlineColor = validationError
    ? 'outline-red-500'
    : 'outline-gm-primary-very-high-contrast';

  return (
    <>
      <ConditionWrapper condition={!!label}>
        <div className='relative ml-4'>
          <label
            htmlFor={inputProps.id}
            className={` text-gm-primary-very-high-contrast`}
          >
            {label}

            <InputLabelUnderline focused={focused} text={label} />
          </label>
        </div>
      </ConditionWrapper>

      <input
        {...inputProps}
        className={`glass-fx ${borderColor} px-4 py-2 w-full 
        outline-none -outline-offset-1 outline-1
        ${focused ? outlineColor : ''} 
        disabled:opacity-20
        disabled:cursor-not-allowed
        hover:border-gm-primary-very-high-contrast
        hover:border-opacity-50`}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        aria-invalid={!!validationError}
        aria-errormessage={validationError}
        aria-disabled={inputProps.disabled}
        disabled={inputProps.disabled}
      />

      <ConditionWrapper condition={!!validationError}>
        <p className={`ml-2 text-red-500`}>{validationError}</p>
      </ConditionWrapper>
    </>
  );
};

export default Input;
