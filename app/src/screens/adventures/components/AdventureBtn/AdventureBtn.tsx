import { ActionContainer } from '@/components';
import './AdventureBtn.css';
import { cn } from '@/util';
import AdventureFrame from '../AdventureFrame/AdventureFrame';
import { FCProps, HtmlProps } from '@/types';

type Props = {
  onClick: (e?: any) => any;
  label: string;
} & HtmlProps<'div'>;

const AdventureBtn: FCProps<Props> = ({
  onClick,
  label,
  className,
  children,
}) => {
  return (
    <AdventureFrame className={cn('adventure-btn', className)}>
      <ActionContainer
        className='children-container'
        onClick={onClick}
        aria-label={label}
      >
        {children}
      </ActionContainer>
    </AdventureFrame>
  );
};

export default AdventureBtn;
