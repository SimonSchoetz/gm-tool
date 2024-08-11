'use client';

import { ButtonHTMLAttributes, DetailedHTMLProps, useState } from 'react';

export type ButtonProps = DetailedHTMLProps<
  ButtonHTMLAttributes<HTMLButtonElement>,
  HTMLButtonElement
> & {
  label: string;
  isLoading?: boolean;
  classNames?: string;
};

const Button = ({
  label,
  isLoading,
  classNames = '',
  ...buttonProps
}: ButtonProps) => {
  const [focused, setFocused] = useState(false);
  const disabled = buttonProps.disabled || isLoading;

  return (
    <button
      {...buttonProps}
      className={`
        ${classNames}
        glass-fx
        rounded-xl 
        px-4 py-2 
        w-full
        ${focused ? 'outline-none  -outline-offset-1 outline-1' : ''}
        outline-gm-primary-very-high-contrast
        text-white 
        hover:border-gm-primary-very-high-contrast
        hover:border-opacity-50
        disabled:opacity-20
        disabled:cursor-not-allowed
      `}
      disabled={disabled}
      aria-disabled={disabled}
      onFocus={() => setFocused(true)}
      onBlur={() => setFocused(false)}
    >
      {isLoading ? 'Loading...' : label}
    </button>
  );
};

export default Button;
