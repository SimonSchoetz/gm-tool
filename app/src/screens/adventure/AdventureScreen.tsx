import './AdventureScreen.css';
import {
  Button,
  CustomScrollArea,
  GlassPanel,
  Input,
  PopUpContainer,
  TextEditor,
  UploadImgBtn,
} from '@/components';
import { cn } from '@/util';
import { useRouter, useParams } from '@tanstack/react-router';
import { useAdventures } from '@/providers/adventures';
import { useEffect, useState } from 'react';
import { Routes } from '@/routes';
import { Adventure } from '@db/adventure';

type PopUpState = React.ComponentProps<typeof PopUpContainer>['state'];

export const AdventureScreen = () => {
  const router = useRouter();
  const { adventureId } = useParams({
    from: `${Routes.ADVENTURE}/$adventureId/`,
  });

  const {
    adventure,
    updateAdventure,
    deleteAdventure,
    initAdventure,
    saveError,
  } = useAdventures();

  useEffect(() => {
    initAdventure(adventureId);
  }, [adventureId, initAdventure]);

  const [deleteDialogState, setDeleteDialogState] =
    useState<PopUpState>('closed');

  if (!adventure || adventure.id !== adventureId) {
    return <div>Loading...</div>;
  }

  const handleAdventureDelete = async () => {
    await deleteAdventure(adventure.id);
    router.navigate({ to: `${Routes.ADVENTURES}` });
  };

  const startDate =
    adventure.created_at && new Date(adventure.created_at).toLocaleDateString();

  return (
    <>
      <GlassPanel className={cn('adventure-screen')}>
        <aside className='adventure-sidebar'>
          <UploadImgBtn
            image_id={adventure.image_id ?? undefined}
            uploadFn={(filePath) =>
              updateAdventure({
                imgFilePath: filePath,
                image_id: adventure.image_id,
              })
            }
          />
          <Button
            label='Delete Adventure'
            onClick={() => setDeleteDialogState('open')}
            buttonStyle={'danger'}
          />
        </aside>

        <CustomScrollArea>
          <div className={cn('text-edit-area')}>
            <div>
              <Input
                type='text'
                placeholder='Adventure Title'
                value={adventure.title}
                onChange={(e) => updateAdventure({ title: e.target.value })}
                className='title-input'
                required
              />

              <ul className={cn('adventure-facts')}>
                <li>
                  Started: <span>{startDate}</span>
                </li>
                <li>
                  Sessions: <span>0</span>
                </li>
                <li>
                  NPCs: <span>0</span>
                </li>
                <li>
                  PCs: <span>0</span>
                </li>
                <li>
                  Party Level: <span>0</span>
                </li>
              </ul>
            </div>

            {saveError && <div className='error-message'>{saveError}</div>}
            <TextEditor
              value={adventure?.description || ''}
              textEditorId={`Adventure_${adventure.id}`}
              onChange={(description) => updateAdventure({ description })}
            />
          </div>
        </CustomScrollArea>
      </GlassPanel>
      <PopUpContainer state={deleteDialogState} setState={setDeleteDialogState}>
        <DeleteAdventureDialog
          adventure={adventure}
          onDeletionConfirm={handleAdventureDelete}
        />
      </PopUpContainer>
    </>
  );
};

type DeleteAdventureDialogProps = {
  adventure: Adventure;
  onDeletionConfirm: () => void;
};

const DeleteAdventureDialog = ({
  adventure,
  onDeletionConfirm,
}: DeleteAdventureDialogProps) => {
  const [intensity, setIntensity] = useState<number>(0);
  const confirmText = 'DELETE ADVENTURE';

  const handleInputChange = (input: string) => {
    const targetSubString = confirmText.substring(0, input.length);
    if (input === targetSubString) {
      setIntensity((1 / confirmText.length) * input.length);
    } else {
      setIntensity(0);
    }

    if (input === confirmText) {
      onDeletionConfirm();
    }
  };

  return (
    <GlassPanel
      className={cn('delete-adventure-dialog')}
      style={{
        boxShadow: `inset 0 -${intensity * 5}px ${intensity * 10}px rgb(var(--color-danger-hover-rgb), ${intensity / 2})`,
        background: `radial-gradient(ellipse 50% 80% at 50% 100%, rgb(var(--color-danger-hover-rgb), ${intensity}), transparent)`,
      }}
    >
      <h1 className='delete-adventure-dialog-title'>
        Delete {adventure.title}
      </h1>
      <p>
        You are about to delete this adventure with all its sessions,
        characters, images, ect. This action can not be undone.
      </p>
      <p>
        Type
        <span className='delete-adventure-dialog-confirm-text'>
          {` ${confirmText} `}
        </span>
        below to confirm this action:
      </p>
      <Input
        className='delete-adventure-dialog-input'
        placeholder={confirmText}
        onChange={(e) => handleInputChange(e.target.value)}
      />
    </GlassPanel>
  );
};
