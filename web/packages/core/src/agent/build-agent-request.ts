import type { AgentBoard, AgentGadget, AgentRequest } from "./ag-ui.js";

/**
 * Builds the body of a chat request from what the user typed and what the host is showing.
 *
 * The gadget library grounds `add_gadget`'s `componentType` in types that exist, and the board's
 * gadgets ground `move_gadget` and `remove_gadget`'s `gadgetQuery` in real titles, so the model
 * picks from what is there instead of inventing names.
 */
export function buildAgentRequest(
  message: string,
  board: AgentBoard | undefined,
  library: readonly AgentGadget[],
): AgentRequest {
  return {
    message,
    boardContext: {
      boardId: board?.id,
      boardTitle: board?.title,
      activeTab: undefined,
    },
    gadgetLibrary: library.map((gadget) => ({
      componentType: gadget.componentType,
      title: gadget.title,
      subtitle: gadget.subtitle,
      description: gadget.description,
      propertyPages: gadget.propertyPages,
    })),
    boardGadgets: gadgetsOn(board).map((gadget) => ({
      instanceId: gadget.instanceId,
      title: gadget.title,
      componentType: gadget.componentType,
    })),
  };
}

/** Every gadget on a board, row by row and column by column. */
export function gadgetsOn<G extends AgentGadget>(board: AgentBoard<G> | undefined): G[] {
  return (board?.rows ?? []).flatMap((row) => row.columns.flatMap((column) => column.gadgets));
}
