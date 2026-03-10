import { useSessionSteps } from '@/data-access-layer';
import { TextEditor } from '@/components';
import { LAZY_DM_STEPS } from '@/domain/session-steps';
import { StepSectionHeader } from '../StepSectionHeader/StepSectionHeader';
import './StepSection.css';

type Props = {
  stepId: string;
  sessionId: string;
  tooltipVisible: boolean;
  onToggleTooltip: () => void;
};

export const StepSection = ({
  stepId,
  sessionId,
  tooltipVisible,
  onToggleTooltip,
}: Props) => {
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

      {tooltipVisible && step.default_step_key !== null && (() => {
        const definition = LAZY_DM_STEPS.find((s) => s.key === step.default_step_key);
        return definition ? (
          <div className='step-tooltip-panel'>{definition.tooltip}</div>
        ) : null;
      })()}

      <TextEditor
        textEditorId={`step-${step.id}`}
        value={step.content ?? ''}
        onChange={(content) => updateStep(step.id, { content })}
      />
    </div>
  );
};
