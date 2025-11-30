import { ActionContainer } from '@/components';
import './AdventureBtn.css';
import { useState } from 'react';
import { cn, filePicker } from '@/util';
import AdventureFrame from '../AdventureFrame/AdventureFrame';
import { HtmlProps } from '@/types';

type Props = {
  onClick: (e?: any) => any;
  type: 'create' | 'open' | 'upload-img';
} & HtmlProps<'div'>;

const AdventureBtn = ({ onClick, type, ...props }: Props) => {
  switch (type) {
    case 'upload-img':
      return <UploadAdventureImgBtn onClick={onClick} {...props} />;
    default:
      return <NewAdventureBtn onClick={onClick} {...props} />;
  }
};

export default AdventureBtn;

type BtnProps = Omit<Props, 'type'>;

const NewAdventureBtn = ({ onClick }: BtnProps) => {
  const [isClicked, setIsClicked] = useState<boolean>();
  const handleClick = () => {
    setIsClicked(true);
    const timeoutId = setTimeout(() => {
      onClick();
      setIsClicked(false);
    }, 500);
    return () => clearTimeout(timeoutId);
  };

  return (
    <AdventureFrame className={cn('adventure-btn', isClicked && 'activated')}>
      <ActionContainer
        className='children-container'
        onClick={handleClick}
        aria-label='Create new adventure'
      >
        <div className='plus-symbol'>+</div>
      </ActionContainer>
    </AdventureFrame>
  );
};

const UploadAdventureImgBtn = ({ onClick, children }: BtnProps) => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string>();

  const handleClick = async () => {
    if (isLoading) return;
    setIsLoading(true);

    try {
      const filePath = await filePicker('image');

      if (filePath === null) {
        return;
      } else {
        onClick(filePath);
      }
    } catch (err) {
      setError(err?.toString());
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <AdventureFrame className={cn('adventure-btn')}>
        <ActionContainer
          className='children-container'
          onClick={handleClick}
          aria-label='Upload cover image'
        >
          {children}
        </ActionContainer>
      </AdventureFrame>
      {error && error}
    </>
  );
};
