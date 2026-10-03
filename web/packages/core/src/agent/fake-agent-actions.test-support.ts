import type { AgentBoard, AgentGadget } from "./ag-ui.js";
import type { AgentActions, BoardSummary, GadgetMoveDirection } from "./agent-actions.js";

/** An in memory {@link AgentActions} that records every change instead of making it. */
export class FakeAgentActions implements AgentActions {
  readonly calls: unknown[][] = [];

  constructor(
    private readonly library: AgentGadget[] = [],
    private readonly board: AgentBoard = { id: 1, title: "Board", rows: [] },
    private readonly boards: BoardSummary[] = [],
  ) {}

  async findGadgetDefinition(componentType: string): Promise<AgentGadget | undefined> {
    return this.library.find((gadget) => gadget.componentType === componentType);
  }
  addGadgetToBoard(gadget: AgentGadget): void {
    this.calls.push(["addGadgetToBoard", gadget]);
  }
  async getBoardSummaries(): Promise<BoardSummary[]> {
    return this.boards;
  }
  selectBoard(boardId: number): void {
    this.calls.push(["selectBoard", boardId]);
  }
  async getSelectedBoard(): Promise<AgentBoard> {
    return this.board;
  }
  moveGadget(instanceId: number, direction: GadgetMoveDirection): void {
    this.calls.push(["moveGadget", instanceId, direction]);
  }
  removeGadget(instanceId: number): void {
    this.calls.push(["removeGadget", instanceId]);
  }
  addRow(): void {
    this.calls.push(["addRow"]);
  }
  changeRowLayout(rowIndex: number, structure: string): void {
    this.calls.push(["changeRowLayout", rowIndex, structure]);
  }
}

/** A board with one row of two columns holding the given gadgets in the first column. */
export function boardWith(...gadgets: AgentGadget[]): AgentBoard {
  return { id: 1, title: "Board", rows: [{ columns: [{ gadgets }, { gadgets: [] }] }] };
}
