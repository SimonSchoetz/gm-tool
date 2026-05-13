import { useLayoutEffect, useRef } from 'react';
import { Trash2Icon, UploadIcon, Settings2Icon, XIcon } from 'lucide-react';
import { FCProps } from '@/types';
import { ClickableIcon } from '../../../../ClickableIcon';
import './ImageViewerDialogHeader.css';

type Props = {
  title: string;
  onDeleteClick: () => void;
  onReplaceClick: () => void;
  onSettingsClick: () => void;
  onClose: () => void;
};

export const ImageViewerDialogHeader: FCProps<Props> = ({
  title,
  onDeleteClick,
  onReplaceClick,
  onSettingsClick,
  onClose,
}) => {
  const headerRef = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    const header = headerRef.current;
    if (!header) return;
    // Measures header height so the image can derive its own max-height via
    // calc() without needing a definite parent height — which max-height alone
    // cannot establish for CSS percentage resolution.
    header.parentElement?.style.setProperty(
      '--rt-image-viewer-dialog-header-h',
      `${header.offsetHeight}px`,
    );
  }, []);

  return (
    <div ref={headerRef} className='image-viewer-dialog-header'>
      <span className='image-viewer-dialog-title'>{title}</span>
      <ClickableIcon
        icon={<Trash2Icon />}
        variant='danger'
        label='Delete image'
        title='Delete image'
        onClick={onDeleteClick}
      />
      <ClickableIcon
        icon={<UploadIcon />}
        label='Replace image'
        title='Replace image'
        onClick={onReplaceClick}
      />
      <ClickableIcon
        icon={<Settings2Icon />}
        label='Toggle framing'
        title='Toggle framing'
        onClick={onSettingsClick}
      />
      <ClickableIcon
        icon={<XIcon />}
        label='Close'
        title='Close'
        onClick={onClose}
      />
    </div>
  );
};
