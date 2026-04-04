import { useState } from 'react';
import { useSessionSteps } from '@/data-access-layer';
import { DeleteDialog, PopUpContainer } from '@/components';
import './StepSectionHeader.css';

type PopUpState = React.ComponentProps<typeof PopUpContainer>['state'];

type Props = {
  stepId: string;
  sessionId: string;
  onToggleTooltip: () => void;
  isFirst: boolean;
  isLast: boolean;
};

export const StepSectionHeader = ({
  stepId,
  sessionId,
  onToggleTooltip,
  isFirst,
  isLast,
}: Props) => {
  const { steps, updateStep, reorderSteps, deleteStep } =
    useSessionSteps(sessionId);
  const step = steps.find((s) => s.id === stepId);
  const [deleteDialogState, setDeleteDialogState] =
    useState<PopUpState>('closed');

  if (!step) return null;

  return (
    <>
      <div className='step-section-header'>
        <input
          type='checkbox'
          className='step-checkbox'
          checked={step.checked === 1}
          onChange={() => {
            updateStep(step.id, { checked: step.checked ? 0 : 1 });
          }}
        />

        <input
          type='text'
          className='step-name-input'
          value={step.name ?? ''}
          onChange={(e) => {
            updateStep(step.id, { name: e.target.value });
          }}
          placeholder='Step name'
        />

        {step.default_step_key !== null && (
          <button
            className='step-tooltip-btn'
            onClick={onToggleTooltip}
            title='Show hint'
          >
            ?
          </button>
        )}

        <button
          className='step-move-btn'
          disabled={isFirst}
          title='Move up'
          onClick={() => {
            reorderSteps(step.id, 'up');
          }}
        >
          ↑
        </button>
        <button
          className='step-move-btn'
          disabled={isLast}
          title='Move down'
          onClick={() => {
            reorderSteps(step.id, 'down');
          }}
        >
          ↓
        </button>

        <button
          className='step-delete-btn'
          title='Delete step'
          onClick={() => {
            setDeleteDialogState('open');
          }}
        >
          ✕
        </button>
      </div>

      <PopUpContainer state={deleteDialogState} setState={setDeleteDialogState}>
        <DeleteDialog
          name={step.name ?? 'Untitled Step'}
          onDeletionConfirm={() => {
            void deleteStep(step.id);
          }}
        />
      </PopUpContainer>
    </>
  );
};
