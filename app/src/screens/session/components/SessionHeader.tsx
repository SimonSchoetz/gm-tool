import { useSession } from '@/data-access-layer';
import type { View } from '../SessionScreen';
import './SessionHeader.css';
import { Input, DateInput, LabeledToggleButton } from '@/components';
import { FCProps } from '@/types';

type Props = {
  sessionId: string;
  adventureId: string;
  view: View;
  onViewChange: (view: View) => void;
};

export const SessionHeader: FCProps<Props> = ({
  sessionId,
  adventureId,
  view,
  onViewChange,
}) => {
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

      <div>
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

        <LabeledToggleButton
          options={[
            { value: 'prep', label: 'Prep' },
            { value: 'ingame', label: 'In Game' },
          ]}
          value={view}
          onChange={onViewChange}
        />
      </div>
    </header>
  );
};
