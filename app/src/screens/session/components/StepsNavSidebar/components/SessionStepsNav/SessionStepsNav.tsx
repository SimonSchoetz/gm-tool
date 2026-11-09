import { ReorderableNavList } from '@/components/ReorderableNavList';
import { useSession, useSessionSteps } from '@/data-access-layer';
import { sessionStepName } from '@domain';
import { useParams } from '@tanstack/react-router';
import { stepSectionElementId } from '../../../../helper/stepSectionElementId';

export const SessionStepsNav = () => {
  const { sessionId, adventureId } = useParams({
    from: '/adventure/$adventureId/session/$sessionId',
  });
  const { session } = useSession(sessionId, adventureId);

  const { steps, createStep, bulkReorder, updateStep } =
    useSessionSteps(sessionId);

  return (
    <ReorderableNavList
      items={steps.map((step) => ({
        id: step.id,
        label: sessionStepName(step.name, step.default_step_key),
        isChecked: step.checked === 1,
      }))}
      activeId={null}
      onSelect={(stepId) => {
        const step = steps.find((s) => s.id === stepId) ?? null;
        if (session?.active_view === 'ingame' && step?.collapsed === 1) {
          updateStep(stepId, { collapsed: 0 });
        }
        document.getElementById(stepSectionElementId(stepId))?.scrollIntoView({
          behavior: 'smooth',
          block: 'start',
        });
      }}
      onReorder={bulkReorder}
      newItemRef={null}
      newItem={
        session?.active_view === 'prep'
          ? {
              label: 'Add step',
              onClick: () => {
                void createStep();
              },
            }
          : null
      }
    />
  );
};
