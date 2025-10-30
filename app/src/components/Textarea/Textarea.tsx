import { TextareaHTMLAttributes } from 'react';
import './Textarea.css';

type TextareaProps = TextareaHTMLAttributes<HTMLTextAreaElement> & {
  label?: string;
  error?: string;
};

const Textarea = ({
  label,
  error,
  className = '',
  ...props
}: TextareaProps) => {
  const classNames = ['textarea', error && 'textarea--error', className]
    .filter(Boolean)
    .join(' ');

  return (
    <div className="textarea-wrapper">
      {label && <label className="textarea-label">{label}</label>}
      <textarea className={classNames} {...props} />
      {error && <span className="textarea-error">{error}</span>}
    </div>
  );
};

export default Textarea;
