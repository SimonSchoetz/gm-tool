import { useSessionSteps } from '@/data-access-layer';
import { TextEditor, GlassPanel } from '@/components';
import { StepSectionHeader, TooltipPanel } from './components';
import './StepSection.css';
import { FCProps } from '@/types';
import { useParams } from '@tanstack/react-router';

type Props = {
  stepId: string;
  tooltipVisible: boolean;
  onToggleTooltip: () => void;
};

export const StepSection: FCProps<Props> = ({
  stepId,
  tooltipVisible,
  onToggleTooltip,
}) => {
  const { sessionId } = useParams({
    from: '/adventure/$adventureId/session/$sessionId',
  });
  const { steps, updateStep } = useSessionSteps(sessionId);
  const step = steps.find((s) => s.id === stepId);

  if (!step) return null;

  const stepIndex = steps.findIndex((s) => s.id === stepId);
  const isFirst = stepIndex === 0;
  const isLast = stepIndex === steps.length - 1;

  return (
    <GlassPanel
      intensity='bright'
      id={`step-section-${stepId}`}
      className='step-section'
    >
      <StepSectionHeader
        stepId={stepId}
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
    </GlassPanel>
  );
};
