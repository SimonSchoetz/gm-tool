import { useLayoutEffect, useRef } from 'react';
import { Trash2Icon, UploadIcon, XIcon } from 'lucide-react';
import { FCProps } from '@/types';
import { filePicker } from '@/util';
import { useDeleteDialog } from '@/providers';
import GlassPanel from '../../../GlassPanel/GlassPanel';
import { ClickableIcon } from '../../../ClickableIcon';
import { ImageById } from '../../../ImageById/ImageById';
import './ImageViewerDialog.css';

type Props = {
  image_id: string;
  title: string;
  onClose: () => void;
  uploadFn: (filePath: string) => void;
  deleteFn: () => void;
};

export const ImageViewerDialog: FCProps<Props> = ({
  image_id,
  title,
  onClose,
  uploadFn,
  deleteFn,
}) => {
  const { openDeleteDialog } = useDeleteDialog();
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

  const handleDeleteClick = () => {
    openDeleteDialog({
      name: `${title} image`,
      onDeletionConfirm: () => {
        deleteFn();
        onClose();
      },
      oneClickConfirm: true,
    });
  };

  const handleReplaceClick = async () => {
    const filePath = await filePicker('image');
    if (filePath !== null) {
      uploadFn(filePath);
      onClose();
    }
  };

  return (
    <GlassPanel intensity='bright' className='image-viewer-dialog'>
      <div ref={headerRef} className='image-viewer-dialog-header'>
        <span className='image-viewer-dialog-title'>{title}</span>
        <ClickableIcon
          icon={<Trash2Icon />}
          variant='danger'
          label='Delete image'
          title='Delete image'
          onClick={handleDeleteClick}
        />
        <ClickableIcon
          icon={<UploadIcon />}
          label='Replace image'
          title='Replace image'
          onClick={() => { void handleReplaceClick(); }}
        />
        <ClickableIcon
          icon={<XIcon />}
          label='Close'
          title='Close'
          onClick={onClose}
        />
      </div>
      <div className='image-viewer-dialog-content'>
        <ImageById
          imageId={image_id}
          className='image-viewer-dialog-img'
          alt={`${title} image`}
        />
      </div>
    </GlassPanel>
  );
};
