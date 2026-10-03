import { Injectable } from '@angular/core';
import { firstValueFrom, map } from 'rxjs';
import type { AgentActions, BoardSummary, GadgetMoveDirection } from '@armature/core';
import { EventService } from '../eventservice/event.service';
import { BoardService } from '../board/board.service';
import { IBoard } from '../board/board.model';
import { LibraryService } from '../library/library.service';
import { IGadget } from '../gadgets/common/gadget-common/gadget-base/gadget.model';
import { LayoutType } from '../layout/layout.model';

export type { BoardSummary, GadgetMoveDirection } from '@armature/core';

/**
 * The Angular host's AgentActions: turns an assistant tool call into a real app change through
 * the same EventService, BoardService, and LibraryService paths the Library and Sidenav panels
 * use, so gadget placement and board switching are identical from the UI or from chat.
 */
@Injectable({ providedIn: 'root' })
export class AgentActionService implements AgentActions<IGadget> {
  constructor(
    private eventService: EventService,
    private boardService: BoardService,
    private libraryService: LibraryService
  ) {}

  findGadgetDefinition(componentType: string): Promise<IGadget | undefined> {
    return firstValueFrom(
      this.libraryService
        .getLibrary()
        .pipe(map((library) => library.find((gadget) => gadget.componentType === componentType)))
    );
  }

  addGadgetToBoard(gadget: IGadget): void {
    this.eventService.emitLibraryAddGadgetEvent({ data: gadget });
  }

  getBoardSummaries(): Promise<BoardSummary[]> {
    return firstValueFrom(
      this.boardService
        .getBoardCollection()
        .pipe(map((collection) => collection.boardList.map((board) => ({ id: board.id, title: board.title }))))
    );
  }

  selectBoard(boardId: number): void {
    this.eventService.emitBoardSelectedEvent({ data: boardId });
  }

  getSelectedBoard(): Promise<IBoard> {
    return firstValueFrom(this.boardService.getLastSelectedBoard());
  }

  moveGadget(instanceId: number, direction: GadgetMoveDirection): void {
    this.eventService.emitGadgetMoveRequestEvent({ data: { instanceId, direction } });
  }

  removeGadget(instanceId: number): void {
    this.eventService.emitGadgetDeleteEvent({ data: instanceId });
  }

  addRow(): void {
    this.eventService.emitBoardAddRowEvent();
  }

  changeRowLayout(rowIndex: number, structure: string): void {
    this.eventService.emitLayoutChange({ data: { structure: structure as LayoutType, rowIndex } });
  }
}
