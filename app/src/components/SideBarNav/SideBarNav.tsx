import { FCProps, HtmlProps } from '@/types';
import './SideBarNav.css';
import { GlassPanel } from '../GlassPanel/GlassPanel';
import { ScreenNavBtn } from './components';
import { useRouterState } from '@tanstack/react-router';
import { useTableConfigs } from '@/data-access-layer';
import { CustomScrollArea } from '../CustomScrollArea';
import { cn } from '@/util';

type Props = HtmlProps<'aside'>;

export const SideBarNav: FCProps<Props> = ({ className, ...props }) => {
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
    <aside className={cn('sidebar-nav', className)} {...props}>
      <GlassPanel className='sidebar-nav--content-container'>
        <CustomScrollArea>
          <ul className='sidebar-nav--btn-group'>
            <li>
              <ScreenNavBtn label='Adventures' to='/adventures' />
            </li>
            <li>
              <ScreenNavBtn
                label='Sessions'
                to='/adventure/$adventureId/sessions'
                isDisabled={!adventureId}
                configColor={getTableColor('sessions')}
              />
            </li>
            <li>
              <ScreenNavBtn
                label='Encounters'
                to='/adventure/$adventureId/encounters'
                isDisabled={!adventureId}
                configColor={getTableColor('encounters')}
              />
            </li>
            <li>
              <ScreenNavBtn
                label='PCs'
                to='/adventure/$adventureId/pcs'
                isDisabled={!adventureId}
                configColor={getTableColor('pcs')}
              />
            </li>
            <li>
              <ScreenNavBtn
                label='NPCs'
                to='/adventure/$adventureId/npcs'
                isDisabled={!adventureId}
                configColor={getTableColor('npcs')}
              />
            </li>
            <li>
              <ScreenNavBtn
                label='Factions'
                to='/adventure/$adventureId/factions'
                isDisabled={!adventureId}
                configColor={getTableColor('factions')}
              />
            </li>
            <li>
              <ScreenNavBtn
                label='Locations'
                to='/adventure/$adventureId/locations'
                isDisabled={!adventureId}
                configColor={getTableColor('locations')}
              />
            </li>
            <li>
              <ScreenNavBtn
                label='Foes'
                to='/adventure/$adventureId/foes'
                isDisabled={!adventureId}
                configColor={getTableColor('foes')}
              />
            </li>
            <li>
              <ScreenNavBtn
                label='Items'
                to='/adventure/$adventureId/items'
                isDisabled={!adventureId}
                configColor={getTableColor('items')}
              />
            </li>
          </ul>
        </CustomScrollArea>
      </GlassPanel>
    </aside>
  );
};
