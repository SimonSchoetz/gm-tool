import { InputHTMLAttributes } from 'react';
import './Input.css';
import { cn } from '@/util';

type InputProps = InputHTMLAttributes<HTMLInputElement> & {
  label?: string;
  error?: string;
};

const Input = ({ label, error, className = '', ...props }: InputProps) => {
  return (
    <div className='input-wrapper'>
      {label && <label className='input-label'>{`${label}: `}</label>}
      <input
        className={cn('input', error && 'input--error', className)}
        {...props}
      />
      {error && <span className='input-error'>{error}</span>}
    </div>
  );
};

export default Input;
