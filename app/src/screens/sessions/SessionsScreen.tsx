import { useParams, useRouter } from '@tanstack/react-router';
import { useSessions, useTableConfigs } from '@/data-access-layer';
import { SortableList } from '@/components';
import type { Session } from '@db/session';

export const SessionsScreen = () => {
  const router = useRouter();
  const { adventureId } = useParams({
    from: '/adventure/$adventureId/sessions',
  });

  const { sessions, loading, createSession } = useSessions(adventureId);
  const { tableConfigs, loading: configsLoading } = useTableConfigs();

  const sessionsTableConfig = tableConfigs.find(
    (c) => c.table_name === 'sessions',
  );

  const handleSessionCreation = async () => {
    const newSessionId = await createSession({
      adventure_id: adventureId,
      active_view: 'prep',
    });
    void router.navigate({
      to: `/adventure/${adventureId}/session/${newSessionId}`,
    });
  };

  if (loading || configsLoading || !sessionsTableConfig) {
    return <div className='content-center'>Loading...</div>;
  }

  return (
    <SortableList<Session>
      tableConfigId={sessionsTableConfig.id}
      items={sessions}
      onRowClick={(session) => {
        void router.navigate({
          to: `/adventure/${adventureId}/session/${session.id}`,
        });
      }}
      onCreateNew={() => {
        void handleSessionCreation();
      }}
      searchPlaceholder='e.g. "session name, description"'
    />
  );
};
