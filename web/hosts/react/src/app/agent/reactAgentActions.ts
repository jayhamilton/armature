import { firstValueFrom, map } from 'rxjs';
import type { AgentActions, BoardSummary, GadgetMoveDirection } from '@armature/core';
import { eventService } from '../eventservice/event.service';
import { boardService } from '../board/board.service';
import type { IBoard } from '../board/board.model';
import { libraryService } from '../library/library.service';
import type { IGadget } from '../gadgets/common/gadget-common/gadget-base/gadget.model';

/**
 * The React host's AgentActions (armature-ui's AgentActionService): turns an
 * assistant tool call into a real app change through the same eventService,
 * boardService, and libraryService paths the Library and Sidenav panels use,
 * so gadget placement and board switching are identical from the UI or from
 * chat.
 */
export const reactAgentActions: AgentActions<IGadget> = {
  findGadgetDefinition(componentType: string): Promise<IGadget | undefined> {
    return firstValueFrom(
      libraryService
        .getLibrary()
        .pipe(map((library) => library.find((gadget) => gadget.componentType === componentType)))
    );
  },

  addGadgetToBoard(gadget: IGadget): void {
    eventService.emitLibraryAddGadgetEvent({ data: gadget });
  },

  getBoardSummaries(): Promise<BoardSummary[]> {
    return firstValueFrom(
      boardService
        .getBoardCollection()
        .pipe(map((collection) => collection.boardList.map((board) => ({ id: board.id, title: board.title }))))
    );
  },

  selectBoard(boardId: number): void {
    eventService.emitBoardSelectedEvent({ data: boardId });
  },

  getSelectedBoard(): Promise<IBoard> {
    return firstValueFrom(boardService.getLastSelectedBoard());
  },

  moveGadget(instanceId: number, direction: GadgetMoveDirection): void {
    eventService.emitGadgetMoveRequestEvent({ data: { instanceId, direction } });
  },

  removeGadget(instanceId: number): void {
    eventService.emitGadgetDeleteEvent({ data: instanceId });
  },

  addRow(): void {
    eventService.emitBoardAddRowEvent();
  },

  changeRowLayout(rowIndex: number, structure: string): void {
    eventService.emitLayoutChange({ data: { structure, rowIndex } });
  },
};
