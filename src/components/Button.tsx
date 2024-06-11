'use client';

import { ButtonHTMLAttributes, DetailedHTMLProps } from 'react';
import { useFormStatus } from 'react-dom';

export type ButtonProps = DetailedHTMLProps<
  ButtonHTMLAttributes<HTMLButtonElement>,
  HTMLButtonElement
> & {
  label: string;
  isLoading?: boolean;
};

const Button = ({ label, isLoading, ...buttonProps }: ButtonProps) => {
  const { pending } = useFormStatus();
  const loading = isLoading || pending;
  const disabled = buttonProps.disabled || loading;

  return (
    <button
      {...buttonProps}
      className={`
      bg-slate-600 
      text-white 
      rounded-xl 
      px-4 py-2 
      w-full
      ${disabled ? '' : 'hover:bg-slate-400'}
      `}
      disabled={disabled}
      aria-disabled={disabled}
    >
      {loading ? 'Loading...' : label}
    </button>
  );
};

export default Button;
