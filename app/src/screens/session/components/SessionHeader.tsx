import { useSession } from '@/data-access-layer';
import type { View } from '../SessionScreen';
import './SessionHeader.css';
import { Button, Input, DateInput, LabeledToggleButton } from '@/components';
import { FCProps } from '@/types';
import { useParams } from '@tanstack/react-router';

type Props = {
  view: View;
  onViewChange: (view: View) => void;
  areTooltipsVisible: boolean;
  onToggleAllTooltips: () => void;
};

export const SessionHeader: FCProps<Props> = ({
  view,
  onViewChange,
  areTooltipsVisible,
  onToggleAllTooltips,
}) => {
  const { sessionId, adventureId } = useParams({
    from: '/adventure/$adventureId/session/$sessionId',
  });
  const { session, updateSession } = useSession(sessionId, adventureId);

  return (
    <header className='session-header'>
      <Input
        className='session-name-input'
        placeholder='Session name'
        value={session?.name ?? ''}
        onChange={(e) => {
          updateSession({ name: e.target.value });
        }}
      />

      <label className='session-date'>
        <span className='session-date__label'>Session Date:</span>

        <DateInput
          className='session-date__input'
          value={session?.session_date ?? ''}
          onChange={(e) => {
            updateSession({ session_date: e.target.value });
          }}
        />
      </label>

      <div className='view-options-section'>
        <LabeledToggleButton
          options={[
            { value: 'prep', label: 'Prep' },
            { value: 'ingame', label: 'In Game' },
          ]}
          value={view}
          onChange={onViewChange}
        />

        <Button
          className='toggle-all-tooltips-btn'
          onClick={onToggleAllTooltips}
          label={areTooltipsVisible ? 'Hide all hints' : 'Show all hints'}
        />
      </div>
    </header>
  );
};
