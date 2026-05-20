import { FCProps, HtmlProps } from '@/types';
import './SideBarNav.css';
import GlassPanel from '../GlassPanel/GlassPanel';
import { FwBwNav } from './components';
import { ScreenNavBtn } from './components/ScreenNavBtn/ScreenNavBtn';
import { useRouterState } from '@tanstack/react-router';
import { useTableConfigs } from '@/data-access-layer';

type Props = HtmlProps<'aside'>;

export const SideBarNav: FCProps<Props> = ({ ...props }) => {
  const router = useRouterState();

  const { tableConfigs } = useTableConfigs();

  // Extract adventureId from URL if it exists
  const adventureIdMatch = /\/adventure\/([^/]+)/.exec(
    router.location.pathname,
  );
  const adventureId = adventureIdMatch?.[1];

  const getTableColor = (tableName: string): string => {
    const table = tableConfigs.find((t) => t.table_name === tableName);
    return table?.color ?? '';
  };

  return (
    <aside className='sidebar-nav' {...props}>
      <GlassPanel>
        <FwBwNav />
        <div className='sidebar-nav-btn-group'>
          <ScreenNavBtn label='Adventures' to='/adventures' />

          <ScreenNavBtn
            label='Sessions'
            to='/adventure/$adventureId/sessions'
            params={{ adventureId: adventureId ?? '' }}
            isDisabled={!adventureId}
            configColor={getTableColor('sessions')}
          />
          <ScreenNavBtn
            label='NPCs'
            to='/adventure/$adventureId/npcs'
            params={{ adventureId: adventureId ?? '' }}
            isDisabled={!adventureId}
            configColor={getTableColor('npcs')}
          />
          <ScreenNavBtn
            label='Foes'
            to='/adventure/$adventureId/foes'
            params={{ adventureId: adventureId ?? '' }}
            isDisabled={!adventureId}
            configColor={getTableColor('foes')}
          />
          <ScreenNavBtn
            label='Locations'
            to='/adventure/$adventureId/locations'
            params={{ adventureId: adventureId ?? '' }}
            isDisabled={!adventureId}
            configColor={getTableColor('locations')}
          />
          <ScreenNavBtn
            label='Factions'
            to='/adventure/$adventureId/factions'
            params={{ adventureId: adventureId ?? '' }}
            isDisabled={!adventureId}
            configColor={getTableColor('factions')}
          />
          <ScreenNavBtn
            label='PCs'
            to='/adventure/$adventureId/pcs'
            params={{ adventureId: adventureId ?? '' }}
            isDisabled={!adventureId}
            configColor={getTableColor('pcs')}
          />
        </div>

        <ScreenNavBtn label='Settings' to='/settings' />
      </GlassPanel>
    </aside>
  );
};
