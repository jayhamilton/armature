import type { AgentBoard, AgentGadget } from "./ag-ui.js";
import { gadgetsOn } from "./build-agent-request.js";

export interface BoardSummary {
  id: number;
  title: string;
}

export type GadgetMoveDirection = "left" | "right" | "up" | "down";

/**
 * What the assistant needs from a host to act on the board the user is looking at. Each host
 * implements it with the services its own panels already use (the library panel adds gadgets
 * the same way), so a change made from chat behaves exactly like the same change made by hand.
 *
 * The methods that read return promises; the methods that change something are fire and forget,
 * like the host events they raise.
 *
 * @typeParam G - the host's gadget type.
 */
export interface AgentActions<G extends AgentGadget = AgentGadget> {
  /** The library template for a gadget type, or undefined if the library has none. */
  findGadgetDefinition(componentType: string): Promise<G | undefined>;
  addGadgetToBoard(gadget: G): void;
  getBoardSummaries(): Promise<BoardSummary[]>;
  selectBoard(boardId: number): void;
  /** The board the user is looking at. */
  getSelectedBoard(): Promise<AgentBoard<G>>;
  moveGadget(instanceId: number, direction: GadgetMoveDirection): void;
  removeGadget(instanceId: number): void;
  addRow(): void;
  /** Changes a row's column structure; the caller has already checked that the row exists. */
  changeRowLayout(rowIndex: number, structure: string): void;
}

/**
 * The first gadget on the board whose title contains the query, ignoring case. An empty query
 * matches nothing, so a model that leaves the query out cannot remove the first gadget by accident.
 */
export function findGadgetByTitle<G extends AgentGadget>(
  board: AgentBoard<G> | undefined,
  query: string,
): G | undefined {
  const needle = query.trim().toLowerCase();
  if (!needle) return undefined;
  return gadgetsOn(board).find((gadget) => gadget.title.toLowerCase().includes(needle));
}

/**
 * Overlays property values the model wrote onto a deep copy of a library gadget template, the
 * same key to value merge the board repository applies when a user edits a gadget's properties.
 * `title` and `subtitle` set the gadget's own title and subtitle. The template is not changed.
 */
export function applyPropertyValues<G extends AgentGadget>(gadget: G, values: Record<string, unknown>): G {
  // A JSON round trip, as the hosts did before: templates come from library.json, so nothing is lost.
  const merged = JSON.parse(JSON.stringify(gadget)) as G;

  for (const page of merged.propertyPages ?? []) {
    for (const property of page.properties ?? []) {
      if (Object.prototype.hasOwnProperty.call(values, property.key)) {
        property.value = values[property.key];
      }
    }
  }

  if (typeof values["title"] === "string") {
    merged.title = values["title"];
  }
  if (typeof values["subtitle"] === "string") {
    merged.subtitle = values["subtitle"];
  }

  return merged;
}
