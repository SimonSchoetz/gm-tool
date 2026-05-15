import { useState } from 'react';
import { FCProps } from '@/types';
import { filePicker } from '@/util';
import { useDeleteDialog } from '@/providers';
import GlassPanel from '../../../GlassPanel/GlassPanel';
import { ImageById } from '../../../ImageById/ImageById';
import { ImageViewerDialogHeader, FramingOverlay } from './components';
import './ImageViewerDialog.css';
import ImagePlaceholderFrame from '../../../ImagePlaceholderFrame/ImagePlaceholderFrame';

type Props = {
  image_id: string;
  title: string;
  onClose: () => void;
  uploadFn: (filePath: string) => void;
  deleteFn: () => void;
  dimensions: React.ComponentProps<typeof ImagePlaceholderFrame>['dimensions'];
};

export const ImageViewerDialog: FCProps<Props> = ({
  image_id,
  title,
  onClose,
  uploadFn,
  deleteFn,
  dimensions,
}) => {
  const { openDeleteDialog } = useDeleteDialog();
  const [mode, setMode] = useState<'view' | 'framing'>('view');

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
      <ImageViewerDialogHeader
        title={title}
        onDeleteClick={handleDeleteClick}
        onReplaceClick={() => {
          void handleReplaceClick();
        }}
        onSettingsClick={() => {
          setMode((m) => (m === 'view' ? 'framing' : 'view'));
        }}
        onClose={onClose}
      />
      {mode === 'view' && (
        <div className='image-viewer-dialog-content'>
          <ImageById
            imageId={image_id}
            className='image-viewer-dialog-img'
            alt={`${title} image`}
          />
        </div>
      )}
      {mode === 'framing' && (
        <FramingOverlay imageId={image_id} dimensions={dimensions} />
      )}
    </GlassPanel>
  );
};
