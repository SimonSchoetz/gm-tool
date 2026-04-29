import './AdventureScreen.css';
import {
  Button,
  CustomScrollArea,
  GlassPanel,
  Input,
  TextEditor,
  UploadImgBtn,
} from '@/components';
import { cn, getDateTimeString } from '@/util';
import { useRouter, useParams } from '@tanstack/react-router';
import { useAdventure } from '@/data-access-layer';
import { useState } from 'react';
import { useDeleteDialog } from '@/providers';

export const AdventureScreen = () => {
  const router = useRouter();
  const { adventureId } = useParams({
    from: '/adventure/$adventureId/',
  });

  const { adventure, updateAdventure, deleteAdventure, loading } =
    useAdventure(adventureId);
  const { openDeleteDialog } = useDeleteDialog();

  const [adventureName, setAdventureName] = useState(adventure?.name ?? '');
  const [syncedAdventureId, setSyncedAdventureId] = useState(adventure?.id);

  if (adventure?.id !== syncedAdventureId) {
    setSyncedAdventureId(adventure?.id);
    setAdventureName(adventure?.name ?? '');
  }

  if (loading || !adventure) {
    return <div>Loading...</div>;
  }

  const handleAdventureDelete = async () => {
    await deleteAdventure();
    void router.navigate({ to: '/adventures' });
  };

  const startDate =
    adventure.created_at && getDateTimeString(adventure.created_at);

  return (
    <GlassPanel className={cn('adventure-screen')}>
      <aside className='adventure-sidebar'>
        <UploadImgBtn
          image_id={adventure.image_id ?? null}
          uploadFn={(filePath) => {
            updateAdventure({
              imgFilePath: filePath,
              image_id: adventure.image_id,
            });
          }}
        />
        <Button
          label='Delete Adventure'
          onClick={() => {
            openDeleteDialog({
              name: adventure.name,
              onDeletionConfirm: () => {
                void handleAdventureDelete();
              },
              oneClickConfirm: false,
            });
          }}
          buttonStyle={'danger'}
        />
      </aside>

      <CustomScrollArea>
        <div className={cn('adventure-text-edit-area')}>
          <div>
            <Input
              placeholder='Adventure Title'
              value={adventureName}
              onChange={(e) => {
                setAdventureName(e.target.value);
                updateAdventure({ name: e.target.value });
              }}
              className='adventure-title-input'
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
            value={adventure.description ?? ''}
            textEditorId={`Adventure_${adventure.id}`}
            onChange={(description) => {
              updateAdventure({ description });
            }}
          />
        </div>
      </CustomScrollArea>
    </GlassPanel>
  );
};
