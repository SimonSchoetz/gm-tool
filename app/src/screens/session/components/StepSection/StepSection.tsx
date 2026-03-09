import { useSessionSteps } from '@/data-access-layer';
import { TextEditor } from '@/components';
import { StepSectionHeader } from '../StepSectionHeader/StepSectionHeader';
import './StepSection.css';

type Props = {
  stepId: string;
  sessionId: string;
  adventureId: string;
  tooltipVisible: boolean;
  onToggleTooltip: () => void;
};

export const StepSection = ({
  stepId,
  sessionId,
  adventureId,
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
    <div className='step-section'>
      <StepSectionHeader
        stepId={stepId}
        sessionId={sessionId}
        tooltipVisible={tooltipVisible}
        onToggleTooltip={onToggleTooltip}
        isFirst={isFirst}
        isLast={isLast}
      />

      {/* Tooltip area — rendered in sub-feature 7 */}

      <TextEditor
        textEditorId={`step-${step.id}`}
        value={step.content ?? ''}
        adventureId={adventureId}
        onChange={(content) => updateStep(step.id, { content })}
      />
    </div>
  );
};
