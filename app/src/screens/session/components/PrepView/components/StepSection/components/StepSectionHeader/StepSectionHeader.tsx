import { useState } from 'react';
import { useSessionSteps } from '@/data-access-layer';
import {
  DeleteDialog,
  PopUpContainer,
  Checkbox,
  ActionContainer,
} from '@/components';
import { LAZY_DM_STEPS } from '@/domain';
import './StepSectionHeader.css';
import { useParams } from '@tanstack/react-router';
import { FCProps } from '@/types';
import { CircleQuestionMarkIcon, Trash2Icon } from 'lucide-react';
import { StepSectionHeaderTitle, StepSectionHeaderMoveBtn } from './components';
import { cn } from '@/util';

type PopUpState = React.ComponentProps<typeof PopUpContainer>['state'];

type Props = {
  stepId: string;
  onToggleTooltip: () => void;
  tooltipVisible: boolean;
};

export const StepSectionHeader: FCProps<Props> = ({
  stepId,
  onToggleTooltip,
  tooltipVisible,
}) => {
  console.log(tooltipVisible);
  const { sessionId } = useParams({
    from: '/adventure/$adventureId/session/$sessionId',
  });
  const { steps, updateStep, deleteStep } = useSessionSteps(sessionId);
  const step = steps.find((s) => s.id === stepId);
  const [deleteDialogState, setDeleteDialogState] =
    useState<PopUpState>('closed');

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

        <StepSectionHeaderTitle stepId={step.id} />

        {step.default_step_key !== null && (
          <ActionContainer
            className={cn(
              'step-tooltip-btn',
              tooltipVisible && 'step-tooltip-btn__active',
            )}
            onClick={onToggleTooltip}
            title='Show Tooltips'
            label='Show Tooltips'
          >
            <CircleQuestionMarkIcon />
          </ActionContainer>
        )}

        <StepSectionHeaderMoveBtn stepId={stepId} />

        <ActionContainer
          className='step-delete-btn'
          title='Delete step'
          label='Delete step'
          onClick={() => {
            setDeleteDialogState('open');
          }}
        >
          <Trash2Icon />
        </ActionContainer>
      </div>

      <PopUpContainer state={deleteDialogState} setState={setDeleteDialogState}>
        <DeleteDialog
          name={
            step.default_step_key !== null
              ? (LAZY_DM_STEPS.find((s) => s.key === step.default_step_key)
                  ?.name ?? 'Untitled Step')
              : (step.name ?? 'Untitled Step')
          }
          onDeletionConfirm={() => {
            void deleteStep(step.id);
          }}
        />
      </PopUpContainer>
    </>
  );
};
