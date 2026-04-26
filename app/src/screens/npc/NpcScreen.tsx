import {
  Button,
  CustomScrollArea,
  GlassPanel,
  Input,
  TextEditor,
  UploadImgBtn,
} from '@/components';
import { cn } from '@/util';
import { useRouter, useParams } from '@tanstack/react-router';
import { useNpc } from '@/data-access-layer';
import { useState } from 'react';
import { useDeleteDialog } from '@/providers';
import './NpcScreen.css';

export const NpcScreen = () => {
  const router = useRouter();
  const { adventureId, npcId } = useParams({
    from: '/adventure/$adventureId/npc/$npcId',
  });

  const { npc, updateNpc, deleteNpc, loading } = useNpc(npcId);
  const { openDeleteDialog } = useDeleteDialog();

  const [npcName, setNpcName] = useState(npc?.name ?? '');
  const [syncedNpcId, setSyncedNpcId] = useState(npc?.id);

  if (npc?.id !== syncedNpcId) {
    setSyncedNpcId(npc?.id);
    setNpcName(npc?.name ?? '');
  }

  if (loading || !npc) {
    return <div>Loading...</div>;
  }

  const handleNpcDelete = async () => {
    await deleteNpc(adventureId);
    void router.navigate({ to: `/adventure/${adventureId}/npcs` });
  };

  return (
    <GlassPanel className={cn('npc-screen')}>
      <aside className='npc-sidebar'>
        <UploadImgBtn
          dimensions={{ width: '200px', height: '200px' }}
          image_id={npc.image_id ?? null}
          uploadFn={(filePath) => {
            updateNpc({
              imgFilePath: filePath,
              image_id: npc.image_id,
            });
          }}
        />

        <Button
          label='Delete NPC'
          onClick={() => {
            openDeleteDialog(npc.name, handleNpcDelete);
          }}
          buttonStyle={'danger'}
        />
      </aside>

      <CustomScrollArea>
        <div className={cn('npc-text-edit-area')}>
          <GlassPanel className='npc-summary' intensity='bright'>
            <Input
              placeholder='Name'
              value={npcName}
              onChange={(e) => {
                setNpcName(e.target.value);
                updateNpc({ name: e.target.value });
              }}
              className='npc-name-input'
              required
            />

            <CustomScrollArea>
              <TextEditor
                placeholder='Summmary'
                value={npc.summary ?? ''}
                textEditorId={`NPC_${npc.id}_summary`}
                onChange={(summary) => {
                  updateNpc({ summary });
                }}
              />
            </CustomScrollArea>
          </GlassPanel>

          <TextEditor
            value={npc.description ?? ''}
            textEditorId={`NPC_${npc.id}_description`}
            onChange={(description) => {
              updateNpc({ description });
            }}
          />
        </div>
      </CustomScrollArea>
    </GlassPanel>
  );
};
