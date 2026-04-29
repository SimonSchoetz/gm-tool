import { Button } from '@/components';
import { useSession } from '@/data-access-layer';
import { useDeleteDialog } from '@/providers';
import { useRouter, useParams } from '@tanstack/react-router';

export const DeleteSessionBtn = () => {
  const router = useRouter();
  const { sessionId, adventureId } = useParams({
    from: '/adventure/$adventureId/session/$sessionId',
  });
  const { session, deleteSession } = useSession(sessionId, adventureId);

  const { openDeleteDialog } = useDeleteDialog();

  const handleSessionDelete = async () => {
    await deleteSession();
    void router.navigate({ to: `/adventure/${adventureId}/sessions` });
  };

  if (session?.active_view !== 'prep') return null;

  return (
    <Button
      label='Delete Session'
      onClick={() => {
        openDeleteDialog({
          name: session.name ?? '',
          onDeletionConfirm: () => {
            void handleSessionDelete();
          },
          oneClickConfirm: false,
        });
      }}
      buttonStyle={'danger'}
    />
  );
};
