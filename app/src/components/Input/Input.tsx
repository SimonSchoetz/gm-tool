import { InputHTMLAttributes } from 'react';
import './Input.css';

type InputProps = InputHTMLAttributes<HTMLInputElement> & {
  label?: string;
  error?: string;
};

const Input = ({ label, error, className = '', ...props }: InputProps) => {
  const classNames = ['input', error && 'input--error', className]
    .filter(Boolean)
    .join(' ');

  return (
    <div className="input-wrapper">
      {label && <label className="input-label">{label}</label>}
      <input className={classNames} {...props} />
      {error && <span className="input-error">{error}</span>}
    </div>
  );
};

export default Input;
