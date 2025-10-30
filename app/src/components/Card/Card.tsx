import { HTMLAttributes } from 'react';
import './Card.css';

type CardProps = HTMLAttributes<HTMLDivElement>;

const Card = ({ className = '', children, ...props }: CardProps) => {
  const classNames = ['card', className].filter(Boolean).join(' ');

  return (
    <div className={classNames} {...props}>
      {children}
    </div>
  );
};

export default Card;
