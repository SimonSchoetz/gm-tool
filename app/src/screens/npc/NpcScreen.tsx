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
import { useNpc } from '@/providers/npcs';
import { useState } from 'react';
import { Routes } from '@/routes';
import './NpcScreen.css';

type PopUpState = React.ComponentProps<typeof PopUpContainer>['state'];

export const NpcScreen = () => {
  const router = useRouter();
  const { adventureId, npcId } = useParams({
    from: `/${Routes.ADVENTURE}/$adventureId/${Routes.NPC}/$npcId`,
  });

  const { npc, updateNpc, deleteNpc, loading, saveError } = useNpc(npcId);

  const [deleteDialogState, setDeleteDialogState] =
    useState<PopUpState>('closed');

  if (loading || !npc) {
    return <div>Loading...</div>;
  }

  const handleNpcDelete = async () => {
    await deleteNpc(adventureId);
    router.navigate({ to: `/${Routes.ADVENTURE}/${adventureId}/npcs` });
  };

  return (
    <>
      <GlassPanel className={cn('npc-screen')}>
        <aside className='npc-sidebar'>
          <UploadImgBtn
            dimensions={{ width: '200px', height: '200px' }}
            image_id={npc.image_id ?? undefined}
            uploadFn={(filePath) =>
              updateNpc({
                imgFilePath: filePath,
                image_id: npc.image_id,
              })
            }
          />

          {saveError && <div className='save-error-message'>{saveError}</div>}

          <Button
            label='Delete NPC'
            onClick={() => setDeleteDialogState('open')}
            buttonStyle={'danger'}
          />
        </aside>

        <CustomScrollArea>
          <div className={cn('npc-text-edit-area')}>
            <GlassPanel className='npc-summary' intensity='bright'>
              <Input
                type='text'
                placeholder='Name'
                value={npc.name}
                onChange={(e) => updateNpc({ name: e.target.value })}
                className='npc-name-input'
                required
              />

              <CustomScrollArea>
                <TextEditor // <- Can I restrict line count?
                  placeholder='Summmary'
                  value={npc?.summary || ''}
                  textEditorId={`NPC_${npc.id}`}
                  onChange={(summary) => updateNpc({ summary })}
                />
              </CustomScrollArea>
            </GlassPanel>

            <TextEditor
              value={npc?.description || ''}
              textEditorId={`NPC_${npc.id}`}
              onChange={(description) => updateNpc({ description })}
            />
          </div>
        </CustomScrollArea>
      </GlassPanel>

      <PopUpContainer state={deleteDialogState} setState={setDeleteDialogState}>
        <DeleteDialog name={npc.name} onDeletionConfirm={handleNpcDelete} />
      </PopUpContainer>
    </>
  );
};
