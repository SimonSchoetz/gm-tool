import { useSessionSteps } from '@/data-access-layer';
import './StepSectionHeader.css';

type Props = {
  stepId: string;
  sessionId: string;
  tooltipVisible: boolean;
  onToggleTooltip: () => void;
  isFirst: boolean;
  isLast: boolean;
};

export const StepSectionHeader = ({
  stepId,
  sessionId,
  tooltipVisible: _tooltipVisible,
  onToggleTooltip,
  isFirst,
  isLast,
}: Props) => {
  const { steps, updateStep, reorderSteps } = useSessionSteps(sessionId);
  const step = steps.find((s) => s.id === stepId);

  if (!step) return null;

  return (
    <div className='step-section-header'>
      <input
        type='checkbox'
        className='step-checkbox'
        checked={step.checked === 1}
        onChange={() => updateStep(step.id, { checked: step.checked ? 0 : 1 })}
      />

      <input
        type='text'
        className='step-name-input'
        value={step.name ?? ''}
        onChange={(e) => updateStep(step.id, { name: e.target.value })}
        placeholder='Step name'
      />

      {/* Tooltip toggle — only for default steps */}
      {step.default_step_key !== null && (
        <button className='step-tooltip-btn' onClick={onToggleTooltip} title='Show hint'>
          ?
        </button>
      )}

      <button
        className='step-move-btn'
        disabled={isFirst}
        title='Move up'
        onClick={() => reorderSteps(step.id, 'up')}
      >
        ↑
      </button>
      <button
        className='step-move-btn'
        disabled={isLast}
        title='Move down'
        onClick={() => reorderSteps(step.id, 'down')}
      >
        ↓
      </button>

      {/* Delete button — wired in sub-feature 10 */}
      <button className='step-delete-btn' title='Delete step'>
        ✕
      </button>
    </div>
  );
};
