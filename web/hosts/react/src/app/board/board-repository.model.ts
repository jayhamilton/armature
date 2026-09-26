import type { Observable } from 'rxjs';
import type { IGadget } from '../gadgets/common/gadget-common/gadget-base/gadget.model';
import type { IBoard, IRow } from './board.model';

/**
 * Persistence boundary for board data. BoardService owns domain logic
 * (which column a new gadget lands in, instanceId generation, tabs/
 * relationship bookkeeping) and is the only thing components talk to;
 * everything below this interface is just "where the bytes live."
 *
 * Every method is scoped to the resource it actually changes rather than
 * the whole board collection, so a REST implementation later can do
 * `PATCH /boards/:id` for a title edit instead of `PUT /boards` with the
 * entire account's boards.
 */
export interface IBoardRepository {
  getBoards(): Observable<IBoard[]>;

  getBoard(boardId: number): Observable<IBoard | undefined>;

  getLastSelectedBoardId(): Observable<number>;

  setLastSelectedBoardId(boardId: number): Observable<void>;

  /**
   * Creates a board. `pairWithExistingBoardId`, when given, additionally
   * pairs it with an existing board as tabs of one another: the new board
   * becomes the tab-group parent, the existing board becomes its child.
   */
  createBoard(board: IBoard, pairWithExistingBoardId?: number): Observable<IBoard>;

  updateBoardMeta(
    boardId: number,
    meta: { title: string; description: string; icon: string }
  ): Observable<void>;

  /**
   * Removes a board and detaches it from any parent/child tab relationship.
   * Returns the ids of boards whose `tabs`/`relationship` changed as a
   * result, so callers relying on stale in-memory copies know what else to
   * refresh.
   */
  deleteBoard(boardId: number): Observable<{ affectedBoardIds: number[] }>;

  /** Layout edits and drag-and-drop both boil down to "this board's rows are now this." */
  replaceBoardRows(boardId: number, rows: IRow[], structure?: string): Observable<void>;

  /** Persists the whole-board width/padding preset (see IBoard.contentWidth). */
  updateBoardContentWidth(boardId: number, contentWidth: string): Observable<void>;

  /**
   * Persists a new gadget instance into a specific board/row/column. The
   * repository (not the caller) assigns instanceId.
   */
  addGadget(
    boardId: number,
    rowIndex: number,
    columnIndex: number,
    gadgetTemplate: IGadget
  ): Observable<IGadget>;

  /** Gadget instanceIds are already globally unique in this model, so no boardId is needed. */
  removeGadget(instanceId: number): Observable<void>;

  updateGadgetProperties(instanceId: number, propertiesJSON: string): Observable<void>;
}
