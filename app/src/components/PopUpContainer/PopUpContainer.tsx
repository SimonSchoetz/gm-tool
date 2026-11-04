import { useEffect, Dispatch, SetStateAction, useState } from 'react';
import { HtmlProps } from '@/types/htmlProps.type';
import { cn } from '@/util/className';
import './PopUpContainer.css';

type Props = {
  state: 'open' | 'closed';
  setState: Dispatch<SetStateAction<'open' | 'closed'>>;
} & HtmlProps<'div'>;

const PopUpContainer = ({
  state,
  setState,
  className = '',
  children,
  ...props
}: Props) => {
  const [isOpen, setIsOpen] = useState(state === 'open');
  const [isClosing, setIsClosing] = useState(false);

  // Animation state machine: isOpen/isClosing are timed states that cannot be derived from the prop alone — the closing animation must stay open for 500ms after state goes 'closed'.
  useEffect(() => {
    if (state === 'open') {
      setIsOpen(true); // eslint-disable-line react-hooks/set-state-in-effect
    } else {
      setIsClosing(true);
      const timeoutId = setTimeout(() => {
        setIsClosing(false);
        setIsOpen(false);
      }, 500);

      return () => {
        clearTimeout(timeoutId);
      };
    }
  }, [state]);

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        setState('closed');
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
    };
  }, [isOpen, setState]);

  const handleOverlayClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) {
      setState('closed');
    }
  };

  if (!isOpen) return;

  return (
    <div
      className={cn('popup-background', isClosing && 'closing')}
      onClick={handleOverlayClick}
      role='dialog'
      aria-modal='true'
      aria-label='Popup dialog'
    >
      <div
        className={cn('popup-content', isClosing && 'closing', className)}
        {...props}
      >
        {children}
      </div>
    </div>
  );
};

export default PopUpContainer;
