import { ButtonHTMLAttributes } from 'react';
import './Button.css';

type ButtonVariant = 'primary' | 'secondary' | 'danger';
type ButtonSize = 'small' | 'medium' | 'large';

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant;
  size?: ButtonSize;
};

const Button = ({
  variant = 'primary',
  size = 'medium',
  className = '',
  children,
  ...props
}: ButtonProps) => {
  const classNames = [
    'button',
    `button--${variant}`,
    `button--${size}`,
    className,
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <button className={classNames} {...props}>
      {children}
    </button>
  );
};

export default Button;
