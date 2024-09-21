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

  const composedLabel = composeLabel(label, !!inputProps.required);

  return (
    <>
      <ConditionWrapper condition={!!composedLabel}>
        <div className='relative ml-4'>
          <label
            htmlFor={inputProps.id}
            className={`text-gm-fg`}
            data-testid='input-label'
          >
            {composedLabel}

            <InputLabelUnderline focused={focused} text={composedLabel} />
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
        disabled={inputProps.disabled}
        data-testid='input-field'
        title={`${inputProps.name} input field`}
        aria-label={inputProps.name}
        aria-invalid={!!errorMsg}
        aria-errormessage={errorMsg}
        aria-disabled={inputProps.disabled}
        aria-required={inputProps.required}
      />
      <ConditionWrapper condition={!!errorMsg}>
        <p className={`ml-2 text-gm-error`}>{errorMsg}</p>
      </ConditionWrapper>
    </>
  );
};

export default Input;

const composeLabel = (label?: string, isRequired?: boolean) => {
  if (!label) return '';

  return isRequired ? (
    <>
      <span>{label}</span>
      <span className='text-gm-error'> *</span>
    </>
  ) : (
    label
  );
};
