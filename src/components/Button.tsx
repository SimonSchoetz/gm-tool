'use client';

import { ButtonHTMLAttributes, DetailedHTMLProps } from 'react';

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
  const disabled = buttonProps.disabled || isLoading;

  return (
    <button
      {...buttonProps}
      className={`
      ${classNames}
      bg-slate-600 
      disabled:bg-slate-200
      text-white 
      rounded-xl 
      px-4 py-2 
      w-full
      `}
      disabled={disabled}
      aria-disabled={disabled}
    >
      {isLoading ? 'Loading...' : label}
    </button>
  );
};

export default Button;
