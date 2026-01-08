import { ActionContainer } from '@/components';
import './NewAdventureBtn.css';
import { cn } from '@/util';
import AdventureFrame from '../AdventureFrame/AdventureFrame';
import { FCProps, HtmlProps } from '@/types';

type Props = {
  onClick: (e?: any) => any;
  label: string;
} & HtmlProps<'div'>;

export const NewAdventureBtn: FCProps<Props> = ({
  onClick,
  label,
  className,
  children,
}) => {
  return (
    <ActionContainer
      className={cn('adventure-btn')}
      onClick={onClick}
      label={label}
    >
      <AdventureFrame className={cn('children-container', className)}>
        {children}
      </AdventureFrame>
    </ActionContainer>
  );
};
