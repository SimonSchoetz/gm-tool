import { useParams, useRouter } from '@tanstack/react-router';
import { useSessions, useTableConfigs } from '@/data-access-layer';
import { Routes } from '@/routes';
import { SortableList } from '@/components';
import type { Session } from '@db/session';

export const SessionsScreen = () => {
  const router = useRouter();
  const { adventureId } = useParams({
    from: `/${Routes.ADVENTURE}/$adventureId/${Routes.SESSIONS}`,
  });

  const { sessions, loading, createSession } = useSessions(adventureId);
  const { tableConfigs, loading: configsLoading } = useTableConfigs();

  const sessionsTableConfig = tableConfigs.find((c) => c.table_name === 'sessions');

  const handleSessionCreation = async () => {
    const newSessionId = await createSession({ adventure_id: adventureId });
    router.navigate({
      to: `/${Routes.ADVENTURE}/${adventureId}/${Routes.SESSION}/${newSessionId}`,
    });
  };

  if (loading || configsLoading || !sessionsTableConfig) {
    return <div className='content-center'>Loading...</div>;
  }

  return (
    <SortableList<Session>
      tableConfigId={sessionsTableConfig.id}
      items={sessions}
      onRowClick={(session) =>
        router.navigate({
          to: `/${Routes.ADVENTURE}/${adventureId}/${Routes.SESSION}/${session.id}`,
        })
      }
      onCreateNew={handleSessionCreation}
      searchPlaceholder='e.g. "session name, description"'
    />
  );
};
