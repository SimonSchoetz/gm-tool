import { useSessionSteps } from '@/data-access-layer';
import { TextEditor } from '@/components';
import { StepSectionHeader } from '../StepSectionHeader/StepSectionHeader';
import { TooltipPanel } from './components';
import './StepSection.css';
import { FCProps } from '@/types';

type Props = {
  stepId: string;
  sessionId: string;
  tooltipVisible: boolean;
  onToggleTooltip: () => void;
};

export const StepSection: FCProps<Props> = ({
  stepId,
  sessionId,
  tooltipVisible,
  onToggleTooltip,
}) => {
  const { steps, updateStep } = useSessionSteps(sessionId);
  const step = steps.find((s) => s.id === stepId);

  if (!step) return null;

  const stepIndex = steps.findIndex((s) => s.id === stepId);
  const isFirst = stepIndex === 0;
  const isLast = stepIndex === steps.length - 1;

  return (
    <div id={`step-section-${stepId}`} className='step-section'>
      <StepSectionHeader
        stepId={stepId}
        sessionId={sessionId}
        onToggleTooltip={onToggleTooltip}
        isFirst={isFirst}
        isLast={isLast}
      />

      {tooltipVisible && step.default_step_key != null && (
        <TooltipPanel stepKey={step.default_step_key} />
      )}

      <TextEditor
        textEditorId={`step-${step.id}`}
        value={step.content ?? ''}
        onChange={(content) => {
          updateStep(step.id, { content });
        }}
      />
    </div>
  );
};
