'use client';

import { FCProps } from '@/types/app';
import { ButtonHTMLAttributes, DetailedHTMLProps, useState } from 'react';

export type ButtonProps = DetailedHTMLProps<
  ButtonHTMLAttributes<HTMLButtonElement>,
  HTMLButtonElement
> & {
  label: string;
  isLoading?: boolean;
};

const Button: FCProps<ButtonProps> = ({
  label,
  isLoading,
  className = '',
  ...buttonProps
}) => {
  const [focused, setFocused] = useState(false);
  const [hovered, setHovered] = useState(false);
  const disabled = buttonProps.disabled || isLoading;

  return (
    <button
      aria-label={label}
      style={{
        border: hovered ? '1px solid var(--gm-fg) !important' : '',
      }}
      {...buttonProps}
      className={`
        ${className}
        glass-fx
        rounded-xl 
        px-4 py-2 
        w-full
        outline-none  -outline-offset-1 outline-0
        ${focused || hovered ? 'outline-gm-fg outline-1' : ''}
        outline-gm-fg
        text-gm-fg 
        hover:border-opacity-50
        disabled:opacity-20
        disabled:cursor-not-allowed
        disabled:outline-none
      `}
      type='submit'
      disabled={disabled}
      aria-disabled={disabled}
      onFocus={() => setFocused(true)}
      onBlur={() => setFocused(false)}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {isLoading ? 'Loading...' : label}
    </button>
  );
};

export default Button;
