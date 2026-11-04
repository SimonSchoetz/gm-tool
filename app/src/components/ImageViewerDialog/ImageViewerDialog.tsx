import { Dispatch, SetStateAction, useState } from 'react';
import { createPortal } from 'react-dom';
import { FCProps } from '@/types/fcProps.type';
import { pickImageFile } from '@/util/pickImageFile';
import { useDeleteDialog } from '@/providers/DeleteDialogProvider';
import { GlassPanel } from '../GlassPanel/GlassPanel';
import { ImageById } from '../ImageById/ImageById';
import PopUpContainer from '../PopUpContainer/PopUpContainer';
import { ImageViewerDialogHeader } from './components/ImageViewerDialogHeader';
import { ImagePreviewFramingOverlay } from './components/ImagePreviewFramingOverlay';
import './ImageViewerDialog.css';

type Editing = {
  uploadFn: (filePath: string) => void;
  deleteFn: () => void;
  dimensions: { width: number; height: number };
};

type Props = {
  image_id: string;
  title: string;
  state: 'open' | 'closed';
  setState: Dispatch<SetStateAction<'open' | 'closed'>>;
  editing?: Editing;
};

export const ImageViewerDialog: FCProps<Props> = ({
  image_id,
  title,
  state,
  setState,
  editing,
}) => {
  const { openDeleteDialog } = useDeleteDialog();
  const [mode, setMode] = useState<'view' | 'framing'>('view');
  const [previousState, setPreviousState] = useState(state);

  // Every open starts on the image, and not on a framing mode left open; the reset waits for the next open so the dialog keeps its content while it fades out.
  if (state !== previousState) {
    setPreviousState(state);
    if (state === 'open') setMode('view');
  }

  const close = () => {
    setState('closed');
  };

  const buildActions = ({ uploadFn, deleteFn }: Editing) => ({
    onDeleteClick: () => {
      openDeleteDialog({
        name: `${title} image`,
        onDeletionConfirm: () => {
          deleteFn();
          close();
        },
        oneClickConfirm: true,
      });
    },
    onReplaceClick: () => {
      void pickImageFile().then((filePath) => {
        if (filePath !== null) {
          uploadFn(filePath);
          close();
        }
      });
    },
    onSettingsClick: () => {
      setMode((m) => (m === 'view' ? 'framing' : 'view'));
    },
  });

  return createPortal(
    <PopUpContainer state={state} setState={setState}>
      <GlassPanel intensity='bright' className='image-viewer-dialog'>
        <ImageViewerDialogHeader
          title={title}
          onClose={close}
          {...(editing && { actions: buildActions(editing) })}
        />
        {mode === 'view' && (
          <div className='image-viewer-dialog-content'>
            <ImageById
              imageId={image_id}
              className='image-viewer-dialog-img'
              alt={`${title} image`}
              fullImage
            />
          </div>
        )}
        {mode === 'framing' && editing && (
          <ImagePreviewFramingOverlay
            imageId={image_id}
            dimensions={editing.dimensions}
          />
        )}
      </GlassPanel>
    </PopUpContainer>,
    document.body,
  );
};
