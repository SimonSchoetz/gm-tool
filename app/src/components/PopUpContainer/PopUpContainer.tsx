import { useEffect, Dispatch, SetStateAction, useState } from 'react';
import { HtmlProps } from '@/types';
import { cn } from '@/util';
import GlassPanel from '../GlassPanel/GlassPanel';
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
  const [isOpen, setIsOpen] = useState<boolean>(state === 'open');
  const [isClosing, setIsClosing] = useState<boolean>(false);

  useEffect(() => {
    if (state === 'open') {
      setIsOpen(true);
    } else {
      setIsClosing(true);
      setTimeout(() => {
        setIsClosing(false);
        setIsOpen(false);
      }, 500);
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

  if (!isOpen) return null;

  return (
    <div
      className={cn('popup-overlay', isClosing && 'closing')}
      onClick={handleOverlayClick}
      role='dialog'
      aria-modal='true'
    >
      <GlassPanel
        className={cn('popup-content', isClosing && 'closing', className)}
        {...props}
      >
        {children}
      </GlassPanel>
    </div>
  );
};

export default PopUpContainer;
