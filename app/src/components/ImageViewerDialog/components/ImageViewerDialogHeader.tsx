import { useLayoutEffect, useRef } from 'react';
import { Trash2Icon, UploadIcon, Settings2Icon, XIcon } from 'lucide-react';
import { FCProps } from '@/types/fcProps.type';
import { ClickableIcon } from '../../ClickableIcon/ClickableIcon';
import './ImageViewerDialogHeader.css';

type Props = {
  title: string;
  onClose: () => void;
  actions?: {
    onDeleteClick: () => void;
    onReplaceClick: () => void;
    onSettingsClick: () => void;
  };
};

export const ImageViewerDialogHeader: FCProps<Props> = ({
  title,
  onClose,
  actions,
}) => {
  const headerRef = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    const header = headerRef.current;
    if (!header) return;
    // Measures header height so the image can derive its own max-height via calc() without needing a definite parent height — which max-height alone cannot establish for CSS percentage resolution.
    header.parentElement?.style.setProperty(
      '--rt-image-viewer-dialog-header-h',
      `${header.offsetHeight}px`,
    );
  }, []);

  return (
    <div ref={headerRef} className='image-viewer-dialog-header'>
      <span className='image-viewer-dialog-title'>{title}</span>
      {actions && (
        <>
          <ClickableIcon
            icon={<Trash2Icon />}
            variant='danger'
            label='Delete image'
            title='Delete image'
            onClick={actions.onDeleteClick}
          />
          <ClickableIcon
            icon={<UploadIcon />}
            label='Replace image'
            title='Replace image'
            onClick={actions.onReplaceClick}
          />
          <ClickableIcon
            icon={<Settings2Icon />}
            label='Toggle framing'
            title='Toggle framing'
            onClick={actions.onSettingsClick}
          />
        </>
      )}
      <ClickableIcon
        icon={<XIcon />}
        label='Close'
        title='Close'
        onClick={onClose}
      />
    </div>
  );
};
