import { useState } from 'react';
import { useSessionSteps } from '@/data-access-layer';
import { DeleteDialog, PopUpContainer, Checkbox, Input } from '@/components';
import './StepSectionHeader.css';
import { useParams } from '@tanstack/react-router';
import { FCProps } from '@/types';

type PopUpState = React.ComponentProps<typeof PopUpContainer>['state'];

type Props = {
  stepId: string;
  onToggleTooltip: () => void;
  isFirst: boolean;
  isLast: boolean;
};

export const StepSectionHeader: FCProps<Props> = ({
  stepId,
  onToggleTooltip,
  isFirst,
  isLast,
}) => {
  const { sessionId } = useParams({
    from: '/adventure/$adventureId/session/$sessionId',
  });
  const { steps, updateStep, reorderSteps, deleteStep } =
    useSessionSteps(sessionId);
  const step = steps.find((s) => s.id === stepId);
  const [stepName, setStepName] = useState(step?.name ?? '');
  const [syncedStepId, setSyncedStepId] = useState(step?.id);
  const [deleteDialogState, setDeleteDialogState] =
    useState<PopUpState>('closed');

  if (step?.id !== syncedStepId) {
    setSyncedStepId(step?.id);
    setStepName(step?.name ?? '');
  }

  if (!step) return null;

  return (
    <>
      <div className='step-section-header'>
        <Checkbox
          id={`step-checkbox-${step.id}`}
          checked={step.checked === 1}
          onChange={() => {
            updateStep(step.id, { checked: step.checked ? 0 : 1 });
          }}
        />

        {step.default_step_key !== null ? (
          <label className='step-name' htmlFor={`step-checkbox-${step.id}`}>
            {step.name}
          </label>
        ) : (
          <Input
            className='step-name'
            value={stepName}
            onChange={(e) => {
              setStepName(e.target.value);
              updateStep(step.id, { name: e.target.value });
            }}
            placeholder='Step name'
          />
        )}

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
