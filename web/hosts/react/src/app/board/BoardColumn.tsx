import { useDroppable } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { SortableGadget } from './SortableGadget';
import type { IGadget } from '../gadgets/common/gadget-common/gadget-base/gadget.model';

/** One `cdkDropList` column, ported to @dnd-kit's droppable + sortable context. */
export function BoardColumn({
  id,
  gadgets,
  disabled,
}: {
  id: string;
  gadgets: IGadget[];
  disabled: boolean;
}) {
  const { setNodeRef, isOver } = useDroppable({ id, disabled });

  return (
    <div
      ref={setNodeRef}
      className={[
        'gadget-column',
        gadgets.length === 0 ? 'empty-column-placeholder' : '',
        isOver ? 'column-drop-over' : '',
      ]
        .filter(Boolean)
        .join(' ')}
    >
      <SortableContext items={gadgets.map((g) => `gadget-${g.instanceId}`)} strategy={verticalListSortingStrategy}>
        {gadgets.map((gadget) => (
          <SortableGadget key={gadget.instanceId} gadget={gadget} disabled={disabled} />
        ))}
      </SortableContext>
    </div>
  );
}
