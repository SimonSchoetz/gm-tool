import { FCProps } from '@/types/fcProps.type';
import { HtmlProps } from '@/types/htmlProps.type';
import './SideBarNav.css';
import { GlassPanel } from '../GlassPanel/GlassPanel';
import { ScreenNavBtn } from './components/ScreenNavBtn/ScreenNavBtn';
import { TableNavItem } from './components/TableNavItem/TableNavItem';
import { TABLE_NAV_ITEMS } from './tableNavItems';
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
          {TABLE_NAV_ITEMS.map(({ label, to, tableName }) => (
            <li key={tableName}>
              <TableNavItem
                label={label}
                to={to}
                tableName={tableName}
                isDisabled={isDisabled}
              />
            </li>
          ))}
        </ul>
      </GlassPanel>
    </aside>
  );
};
