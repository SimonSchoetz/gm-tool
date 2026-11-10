import { FCProps } from '@/types/fcProps.type';
import { HtmlProps } from '@/types/htmlProps.type';
import './SideBarNav.css';
import { GlassPanel } from '../GlassPanel/GlassPanel';
import { ScreenNavBtn } from './components/ScreenNavBtn/ScreenNavBtn';
import { TableNavItem } from './components/TableNavItem/TableNavItem';
import { useRouterState } from '@tanstack/react-router';
import { cn } from '@/util/className';

type Props = HtmlProps<'aside'>;

export const SideBarNav: FCProps<Props> = ({ className, ...props }) => {
  const router = useRouterState();

  // Extract adventureId from URL if it exists
  const adventureIdMatch = /\/adventure\/([^/]+)/.exec(
    router.location.pathname,
  );
  const adventureId = adventureIdMatch?.[1];

  const isDisabled = !adventureId;

  return (
    <aside className={cn('sidebar-nav', className)} {...props}>
      <GlassPanel className='sidebar-nav--content-container'>
        <ul className='sidebar-nav--btn-group'>
          <li>
            <ScreenNavBtn label='Adventures' to='/adventures' />
          </li>
          <li>
            <TableNavItem
              label='Sessions'
              to='/adventure/$adventureId/sessions'
              tableName='sessions'
              isDisabled={isDisabled}
            />
          </li>
          <li>
            <TableNavItem
              label='Encounters'
              to='/adventure/$adventureId/encounters'
              tableName='encounters'
              isDisabled={isDisabled}
            />
          </li>
          <li>
            <TableNavItem
              label='PCs'
              to='/adventure/$adventureId/pcs'
              tableName='pcs'
              isDisabled={isDisabled}
            />
          </li>
          <li>
            <TableNavItem
              label='NPCs'
              to='/adventure/$adventureId/npcs'
              tableName='npcs'
              isDisabled={isDisabled}
            />
          </li>
          <li>
            <TableNavItem
              label='Factions'
              to='/adventure/$adventureId/factions'
              tableName='factions'
              isDisabled={isDisabled}
            />
          </li>
          <li>
            <TableNavItem
              label='Locations'
              to='/adventure/$adventureId/locations'
              tableName='locations'
              isDisabled={isDisabled}
            />
          </li>
          <li>
            <TableNavItem
              label='Foes'
              to='/adventure/$adventureId/foes'
              tableName='foes'
              isDisabled={isDisabled}
            />
          </li>
          <li>
            <TableNavItem
              label='Items'
              to='/adventure/$adventureId/items'
              tableName='items'
              isDisabled={isDisabled}
            />
          </li>
        </ul>
      </GlassPanel>
    </aside>
  );
};
