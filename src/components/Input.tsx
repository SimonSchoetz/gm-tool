'use client';

import { DetailedHTMLProps, InputHTMLAttributes, useState } from 'react';
import { ConditionWrapper } from './wrapper';
import { InputLabelUnderline } from './animations';

export type InputProps = DetailedHTMLProps<
  InputHTMLAttributes<HTMLInputElement>,
  HTMLInputElement
> & {
  label?: string;
  errorMsg?: string;
};

const Input = ({ label, errorMsg, ...inputProps }: InputProps) => {
  const [focused, setFocused] = useState(false);
  const [hovered, setHovered] = useState(false);

  const outlineColor = errorMsg ? 'outline-gm-error' : 'outline-gm-fg';

  // rather complicated explicit border styling due to "lights on" fx
  const borderStyling = errorMsg ? '1px solid var(--gm-error ) !important' : '';
  const hoveredBorderStyling = `1px solid var(--gm-${errorMsg ? 'error' : 'fg'})
      !important`;

  return (
    <>
      <ConditionWrapper condition={!!label}>
        <div className='relative ml-4'>
          <label
            htmlFor={inputProps.id}
            className={`text-gm-fg`}
            data-testid='input-label'
          >
            {label}

            <InputLabelUnderline focused={focused} text={label} />
          </label>
        </div>
      </ConditionWrapper>

      <input
        style={{
          border: hovered ? hoveredBorderStyling : borderStyling,
        }}
        {...inputProps}
        className={`glass-fx px-4 py-2 w-full
          rounded-sm
          outline-none -outline-offset-1 outline-1
          ${focused ? outlineColor : ''} 
          disabled:opacity-20
          disabled:cursor-not-allowed
          hover:border-opacity-50`}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        aria-label={inputProps.id}
        aria-invalid={!!errorMsg}
        aria-errormessage={errorMsg}
        aria-disabled={inputProps.disabled}
        disabled={inputProps.disabled}
        data-testid='input-field'
        title={`${inputProps.name} input field`}
      />
      <ConditionWrapper condition={!!errorMsg}>
        <p className={`ml-2 text-red-500`}>{errorMsg}</p>
      </ConditionWrapper>
    </>
  );
};

export default Input;
