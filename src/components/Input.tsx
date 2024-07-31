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
        <div className='relative'>
          <label
            htmlFor={inputProps.id}
            className={`ml-4 text-gm-primary-very-high-contrast`}
          >
            {label}

            <InputLabelUnderline focused={focused} text={label} />
          </label>
        </div>
      </ConditionWrapper>

      <input
        {...inputProps}
        className={`glass-fx ${borderColor} px-4 py-2 w-full ${
          focused ? outlineColor : ''
        } outline-none -outline-offset-1 outline-2`}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        aria-invalid={!!validationError}
        aria-errormessage={validationError}
      />

      <ConditionWrapper condition={!!validationError}>
        <p className={`ml-2 text-red-500`}>{validationError}</p>
      </ConditionWrapper>
    </>
  );
};

export default Input;
