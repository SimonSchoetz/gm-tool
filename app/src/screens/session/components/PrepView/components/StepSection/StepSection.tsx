import { useSessionSteps } from '@/data-access-layer';
import { TextEditor, GlassPanel, HorizontalDivider } from '@/components';
import { StepSectionHeader, TooltipPanel } from './components';
import './StepSection.css';
import { FCProps } from '@/types';
import { useParams } from '@tanstack/react-router';
import { LAZY_DM_STEPS } from '@/domain';

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

  return (
    <GlassPanel
      intensity='bright'
      id={`step-section-${stepId}`}
      className='step-section'
    >
      <StepSectionHeader
        stepId={stepId}
        onToggleTooltip={onToggleTooltip}
        tooltipVisible={tooltipVisible}
      />

      {tooltipVisible && step.default_step_key != null && (
        <TooltipPanel stepKey={step.default_step_key} />
      )}

      <HorizontalDivider className='step-section-divider' />

      <TextEditor
        textEditorId={`step-${step.id}`}
        value={step.content ?? ''}
        placeholder={
          LAZY_DM_STEPS.find((s) => s.key === step.default_step_key)
            ?.placeholder ?? ''
        }
        onChange={(content) => {
          updateStep(step.id, { content });
        }}
      />
    </GlassPanel>
  );
};
