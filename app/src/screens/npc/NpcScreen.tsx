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
import { useNpc } from '@/providers/npcs';
import { useState } from 'react';
import { Routes } from '@/routes';
import { Npc } from '@db/npc';
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
        <DeleteNpcDialog npc={npc} onDeletionConfirm={handleNpcDelete} />
      </PopUpContainer>
    </>
  );
};

type DeleteNpcDialogProps = {
  npc: Npc;
  onDeletionConfirm: () => void;
};

const DeleteNpcDialog = ({ npc, onDeletionConfirm }: DeleteNpcDialogProps) => {
  const [intensity, setIntensity] = useState<number>(0);
  const confirmText = `DELETE ${npc.name}`;

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
      <h1 className='delete-npc-dialog-title'>Delete {npc.name}</h1>
      <p>
        You are about to delete this NPC with all associated data. This action
        cannot be undone.
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
