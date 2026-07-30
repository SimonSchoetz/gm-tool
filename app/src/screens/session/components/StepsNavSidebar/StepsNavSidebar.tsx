import { Button } from '@/components';
import './StepsNavSidebar.css';
import {
  ToggleSessionViewBtn,
  SessionStepsNav,
  DeleteSessionBtn,
} from './components';
import { FCProps, HtmlProps } from '@/types';
import { useSession } from '@/data-access-layer';
import { useParams } from '@tanstack/react-router';
import { ScreensDuplicateBtn } from '../../../components';

type Props = {
  areTooltipsVisible: boolean;
  onToggleAllTooltips: () => void;
} & HtmlProps<'aside'>;

export const StepsNavSidebar: FCProps<Props> = ({
  areTooltipsVisible,
  onToggleAllTooltips,
  ...props
}) => {
  const { sessionId, adventureId } = useParams({
    from: '/adventure/$adventureId/session/$sessionId',
  });
  const { session } = useSession(sessionId, adventureId);

  return (
    <aside className='steps-sidebar' {...props}>
      <ToggleSessionViewBtn />

      <SessionStepsNav />

      {session?.active_view === 'prep' && (
        <>
          <Button
            className='toggle-all-tooltips-btn'
            onClick={onToggleAllTooltips}
            label={areTooltipsVisible ? 'Hide tooltips' : 'Show tooltips'}
          />
          <ScreensDuplicateBtn entityType='sessions' />

          <DeleteSessionBtn />
        </>
      )}
    </aside>
  );
};
