import './AdventureScreen.css';
import {
  Button,
  CustomScrollArea,
  GlassPanel,
  Input,
  PopUpContainer,
} from '@/components';
import { cn } from '@/util';
import { useParams } from '@tanstack/react-router';
import { useAdventures } from '@/data/adventures';
import { UploadAdventureImgBtn } from '@/components/AdventureComponents';
import { useEffect, useState } from 'react';
import { Routes } from '@/routes';
import { TextEditor } from '@/components/TextEditor/TextEditor';
import { Adventure } from '@db/adventure';

type PopUpState = React.ComponentProps<typeof PopUpContainer>['state'];

export const AdventureScreen = () => {
  const [deleteDialogState, setDeleteDialogState] =
    useState<PopUpState>('closed');

  const { adventureId } = useParams({
    from: `${Routes.ADVENTURE}/$adventureId`,
  });

  const { loadAdventure, adventure, setAdventure, handleAdventureUpdate } =
    useAdventures();

  useEffect(() => {
    loadAdventure(adventureId);
    // Cleanup: clear current adventure on unmount
    return () => {
      setAdventure(null);
    };
  }, [adventureId]);

  if (!adventure) {
    return (
      <GlassPanel className={cn('adventure-screen')}>Loading...</GlassPanel>
    );
  }

  const startDate =
    adventure.created_at && new Date(adventure.created_at).toLocaleDateString();

  return (
    <>
      <GlassPanel className={cn('adventure-screen')}>
        <aside className='adventure-sidebar'>
          <UploadAdventureImgBtn />
          <Button
            label='Delete Adventure'
            onClick={() => setDeleteDialogState('open')}
            style={'danger'}
          />
        </aside>

        <CustomScrollArea>
          <div className={cn('text-edit-area')}>
            <div>
              <Input
                type='text'
                placeholder='Adventure Title'
                value={adventure.title}
                onChange={(e) =>
                  handleAdventureUpdate({ title: e.target.value })
                }
                className='title-input'
                required
              />

              <ul className={cn('adventure-stats')}>
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

            <TextEditor
              value={adventure?.description || ''}
              textEditorId={`Adventure_${adventure.id}`}
              onChange={(description) => handleAdventureUpdate({ description })}
            />
          </div>
        </CustomScrollArea>
      </GlassPanel>

      <PopUpContainer state={deleteDialogState} setState={setDeleteDialogState}>
        <DeleteAdventureDialog
          adventure={adventure}
          onDeletionConfirm={() => console.log('confirmed deletion')}
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
  const confirmText = 'DELETE ADVENTURE';
  const handleInputChange = (input: string) => {
    if (input === confirmText) {
      onDeletionConfirm();
    }
  };

  return (
    <GlassPanel className={cn('delete-adventure-dialog')}>
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
