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
import './NpcScreen.css';

type PopUpState = React.ComponentProps<typeof PopUpContainer>['state'];

export const NpcScreen = () => {
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

  return (
    <>
      <GlassPanel className={cn('npc-screen')}>
        <aside className='npc-sidebar'>
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
                placeholder='NPC Name'
                value={adventure.title}
                onChange={(e) => updateAdventure({ title: e.target.value })}
                className='title-input'
                required
              />

              <ul className={cn('npc-facts')}>
                <li>
                  Rank: <span>TBD</span>
                </li>
                <li>
                  Faction: <span>TBD</span>
                </li>
                <li>
                  Hometown: <span>TBD</span>
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
              textEditorId={`NPC_${adventure.id}`}
              onChange={(description) => updateAdventure({ description })}
            />
          </div>
        </CustomScrollArea>
      </GlassPanel>
      <PopUpContainer state={deleteDialogState} setState={setDeleteDialogState}>
        <DeleteAdventureDialog
          adventure={adventure}
          onDeletionConfirm={handleAdventureDelete}
          name={adventure.title}
        />
      </PopUpContainer>
    </>
  );
};

type DeleteAdventureDialogProps = {
  adventure: Adventure;
  onDeletionConfirm: () => void;
  name: string;
};

const DeleteAdventureDialog = ({
  adventure,
  onDeletionConfirm,
  name,
}: DeleteAdventureDialogProps) => {
  const [intensity, setIntensity] = useState<number>(0);
  const confirmText = `DELETE ${name}`;

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
      className={cn('delete-npc-dialog')}
      style={{
        boxShadow: `inset 0 -${intensity * 5}px ${intensity * 10}px rgb(var(--color-danger-hover-rgb), ${intensity / 2})`,
        background: `radial-gradient(ellipse 50% 80% at 50% 100%, rgb(var(--color-danger-hover-rgb), ${intensity}), transparent)`,
      }}
    >
      <h1 className='delete-npc-dialog-title'>Delete {adventure.title}</h1>
      <p>
        You are about to delete this adventure with all its sessions,
        characters, images, ect. This action can not be undone.
      </p>
      <p>
        Type
        <span className='delete-npc-dialog-confirm-text'>
          {` ${confirmText} `}
        </span>
        below to confirm this action:
      </p>
      <Input
        className='delete-npc-dialog-input'
        placeholder={confirmText}
        onChange={(e) => handleInputChange(e.target.value)}
      />
    </GlassPanel>
  );
};
