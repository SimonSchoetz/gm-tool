import { TextEditor } from '@/components/TextEditor';
import { useSessionSteps } from '@/data-access-layer';
import { FCProps } from '@/types/fcProps.type';
import { cn } from '@/util/className';
import { ChevronRightIcon } from 'lucide-react';
import './InGameStepSection.css';
import { useParams } from '@tanstack/react-router';
import { InGameStepSectionTitle } from './components/InGameStepSectionTitle/InGameStepSectionTitle';
import { stepSectionElementId } from '../../../../helper/stepSectionElementId';

type Props = {
  stepId: string;
};

export const InGameStepSection: FCProps<Props> = ({ stepId }) => {
  const { sessionId } = useParams({
    from: '/adventure/$adventureId/session/$sessionId',
  });
  const { steps, updateStep } = useSessionSteps(sessionId);
  const step = steps.find((s) => s.id === stepId) ?? null;

  if (!step) return;

  const isCollapsed = step.collapsed === 1;

  const elementId = stepSectionElementId(step.id);

  const onHeaderClick = () => {
    updateStep(step.id, { collapsed: isCollapsed ? 0 : 1 });
  };

  const onContentChange = (content: string) => {
    updateStep(step.id, { content });
  };

  return (
    <div
      id={elementId}
      className={cn(
        'in-game-step-section',
        isCollapsed && 'in-game-step-section--collapsed',
      )}
    >
      <div
        role='button'
        aria-expanded={!isCollapsed}
        className='in-game-step-section-header'
        onClick={onHeaderClick}
      >
        <InGameStepSectionTitle stepId={step.id} />
        <ChevronRightIcon className='in-game-step-section-chevron' />
      </div>
      <div className='in-game-step-section-body'>
        <div className='in-game-step-section-body-inner'>
          <TextEditor
            textEditorId={`in-game-step-${step.id}`}
            value={step.content ?? ''}
            readOnly
            onChange={onContentChange}
          />
        </div>
      </div>
    </div>
  );
};
