import { ButtonHTMLAttributes, DetailedHTMLProps } from 'react';

export type ButtonProps = DetailedHTMLProps<
  ButtonHTMLAttributes<HTMLButtonElement>,
  HTMLButtonElement
> & {
  label: string;
  isLoading?: boolean;
};

const Button = ({ label, isLoading, ...buttonProps }: ButtonProps) => {
  return (
    <button
      {...buttonProps}
      className='bg-slate-600 text-white rounded-xl px-4 py-2 hover:bg-slate-400 w-full'
      disabled={buttonProps.disabled || isLoading}
    >
      {label}
    </button>
  );
};

export default Button;
