import './AdventureScreen.css';
import {
  Button,
  CustomScrollArea,
  DeleteDialog,
  GlassPanel,
  Input,
  PopUpContainer,
  TextEditor,
  UploadImgBtn,
} from '@/components';
import { cn } from '@/util';
import { useRouter, useParams } from '@tanstack/react-router';
import { useAdventure } from '@/data-access-layer/adventures';
import { useState } from 'react';
import { Routes } from '@/routes';

type PopUpState = React.ComponentProps<typeof PopUpContainer>['state'];

export const AdventureScreen = () => {
  const router = useRouter();
  const { adventureId } = useParams({
    from: `/${Routes.ADVENTURE}/$adventureId/`,
  });

  const { adventure, updateAdventure, deleteAdventure, loading, saveError } =
    useAdventure(adventureId);

  const [deleteDialogState, setDeleteDialogState] =
    useState<PopUpState>('closed');

  if (loading || !adventure) {
    return <div>Loading...</div>;
  }

  const handleAdventureDelete = async () => {
    await deleteAdventure();
    router.navigate({ to: `/${Routes.ADVENTURES}` });
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
          {saveError && <div className='save-error-message'>{saveError}</div>}
          <Button
            label='Delete Adventure'
            onClick={() => setDeleteDialogState('open')}
            buttonStyle={'danger'}
          />
        </aside>

        <CustomScrollArea>
          <div className={cn('adventure-text-edit-area')}>
            <div>
              <Input
                type='text'
                placeholder='Adventure Title'
                value={adventure.name}
                onChange={(e) => updateAdventure({ name: e.target.value })}
                className='adventure-title-input'
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

            <TextEditor
              value={adventure?.description || ''}
              textEditorId={`Adventure_${adventure.id}`}
              onChange={(description) => updateAdventure({ description })}
            />
          </div>
        </CustomScrollArea>
      </GlassPanel>
      <PopUpContainer state={deleteDialogState} setState={setDeleteDialogState}>
        <DeleteDialog
          name={adventure.name}
          onDeletionConfirm={handleAdventureDelete}
        />
      </PopUpContainer>
    </>
  );
};
