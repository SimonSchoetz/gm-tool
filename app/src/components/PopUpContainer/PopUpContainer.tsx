import { useEffect, Dispatch, SetStateAction, useState } from 'react';
import { HtmlProps } from '@/types';
import { cn } from '@/util';
import GlassPanel from '../GlassPanel/GlassPanel';
import './PopUpContainer.css';

type Props = {
  state: 'open' | 'closed';
  setState: Dispatch<SetStateAction<'open' | 'closed'>>;
  enforceCancelBtn?: boolean;
} & HtmlProps<'div'>;

const PopUpContainer = ({
  state,
  setState,
  className = '',
  children,
  enforceCancelBtn = false,
  ...props
}: Props) => {
  const [isOpen, setIsOpen] = useState<boolean>(state === 'open');
  const [isClosing, setIsClosing] = useState<boolean>(false);

  useEffect(() => {
    if (state === 'open') {
      setIsOpen(true);
    } else {
      setIsClosing(true);
      const timeoutId = setTimeout(() => {
        setIsClosing(false);
        setIsOpen(false);
      }, 500);

      return () => clearTimeout(timeoutId);
    }
  }, [state]);

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen && !enforceCancelBtn) {
        setState('closed');
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
    };
  }, [isOpen, setState, enforceCancelBtn]);

  const handleOverlayClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget && !enforceCancelBtn) {
      setState('closed');
    }
  };

  if (!isOpen) return null;

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
