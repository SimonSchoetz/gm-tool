import {
  DndContext,
  closestCenter,
  PointerSensor,
  KeyboardSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import {
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  arrayMove,
} from '@dnd-kit/sortable';
import type { DragEndEvent } from '@dnd-kit/core';
import { useSession, useSessionSteps } from '@/data-access-layer';
import { Button, GlassPanel, NewItemBtn } from '@/components';
import './StepsNavSidebar.css';
import { useParams, useRouter } from '@tanstack/react-router';
import { SortableStepItem } from './components';
import { useDeleteDialog } from '@/providers';

export const StepsNavSidebar = () => {
  const router = useRouter();
  const { sessionId, adventureId } = useParams({
    from: '/adventure/$adventureId/session/$sessionId',
  });
  const { session, deleteSession } = useSession(sessionId, adventureId);

  const { steps, createStep, bulkReorder } = useSessionSteps(sessionId);

  const { openDeleteDialog } = useDeleteDialog();

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = steps.findIndex((s) => s.id === active.id);
    const newIndex = steps.findIndex((s) => s.id === over.id);
    const reordered = arrayMove(steps, oldIndex, newIndex);
    bulkReorder(reordered.map((s) => s.id));
  };

  const handleSessionDelete = async () => {
    await deleteSession();
    void router.navigate({ to: `/adventure/${adventureId}/sessions` });
  };

  return (
    <aside className='steps-sidebar'>
      <GlassPanel className='steps-sidebar-nav' intensity='off'>
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <SortableContext
            items={steps.map((s) => s.id)}
            strategy={verticalListSortingStrategy}
          >
            {steps.map((step) => (
              <SortableStepItem key={step.id} step={step} />
            ))}
          </SortableContext>
        </DndContext>
        {session?.active_view === 'prep' && (
          <NewItemBtn
            className='new-step-section-btn'
            type='list-item'
            label='+'
            onClick={() => {
              void createStep();
            }}
          />
        )}
      </GlassPanel>

      {session?.active_view === 'prep' && (
        <Button
          label='Delete Session'
          onClick={() => {
            openDeleteDialog(session.name ?? '', () => {
              void handleSessionDelete();
            });
          }}
          buttonStyle={'danger'}
        />
      )}
    </aside>
  );
};
