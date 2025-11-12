import './Card.css';
import { DivProps } from '@/types/htmlProps';

const Card = ({ className = '', children, ...props }: DivProps) => {
  const classNames = ['card', className].filter(Boolean).join(' ');

  return (
    <div className={classNames} {...props}>
      {children}
    </div>
  );
};

export default Card;
