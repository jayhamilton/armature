import { createContext, useContext } from 'react';
import type { DraggableAttributes, useDraggable } from '@dnd-kit/core';

/**
 * armature-ui's gadget cards were `cdkDrag`-able as a whole, but only the
 * header (`.move-cursor { cursor: move }` in gadget-header.component.scss)
 * was visually the drag handle. Threading @dnd-kit's sortable
 * listeners/attributes down to GadgetHeader through every gadget
 * component's props would mean touching all eleven of them just to plumb a
 * drag handle, so SortableGadget (board/SortableGadget.tsx) provides them
 * via context instead, and GadgetHeader picks them up itself.
 */
export interface DragHandle {
  attributes: DraggableAttributes;
  listeners: ReturnType<typeof useDraggable>['listeners'];
  setActivatorNodeRef: (element: HTMLElement | null) => void;
}

export const DragHandleContext = createContext<DragHandle | null>(null);

export function useDragHandle(): DragHandle | null {
  return useContext(DragHandleContext);
}
