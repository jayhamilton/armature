import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { DragHandleContext } from './DragHandleContext';
import { GadgetHost } from '../gadgets/gadget-grid-cell-host/GadgetHost';
import type { IGadget } from '../gadgets/common/gadget-common/gadget-base/gadget.model';

/**
 * One draggable slot in a board column. Replaces cdkDrag on each gadget's
 * mat-card — @dnd-kit's useSortable gives the same "grab and reorder within
 * or across drop lists" behavior CdkDropListGroup/CdkDropList provided.
 * The drag handle itself is exposed to GadgetHeader via DragHandleContext
 * (see that file for why) instead of making the whole card draggable.
 */
export function SortableGadget({ gadget, disabled }: { gadget: IGadget; disabled: boolean }) {
  const { attributes, listeners, setNodeRef, setActivatorNodeRef, transform, transition, isDragging } =
    useSortable({ id: `gadget-${gadget.instanceId}`, disabled });

  return (
    <div
      ref={setNodeRef}
      style={{
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.4 : 1,
      }}
    >
      <DragHandleContext.Provider value={disabled ? null : { attributes, listeners, setActivatorNodeRef }}>
        <GadgetHost gadgetData={gadget} />
      </DragHandleContext.Provider>
    </div>
  );
}
