import { Injectable } from '@angular/core';
import { map, Observable } from 'rxjs';
import { EventService } from '../eventservice/event.service';
import { BoardService } from '../board/board.service';
import { LibraryService } from '../library/library.service';
import { IGadget } from '../gadgets/common/gadget-common/gadget-base/gadget.model';
import { LayoutType } from '../layout/layout.model';

export interface BoardSummary {
  id: number;
  title: string;
}

export type GadgetMoveDirection = 'left' | 'right' | 'up' | 'down';

/**
 * Turns an assistant tool-call intent into a real app mutation by reusing
 * the same EventService/BoardService/LibraryService paths the Library and
 * Sidenav panels already use, so gadget placement and board switching stay
 * identical whether triggered from the UI or from chat.
 */
@Injectable({ providedIn: 'root' })
export class AgentActionService {
  constructor(
    private eventService: EventService,
    private boardService: BoardService,
    private libraryService: LibraryService
  ) {}

  findGadgetDefinition(gadgetComponentType: string): Observable<IGadget | undefined> {
    return this.libraryService
      .getLibrary()
      .pipe(map((library) => library.find((gadget) => gadget.componentType === gadgetComponentType)));
  }

  addGadgetToBoard(gadget: IGadget): void {
    this.eventService.emitLibraryAddGadgetEvent({ data: gadget });
  }

  getBoardSummaries(): Observable<BoardSummary[]> {
    return this.boardService
      .getBoardCollection()
      .pipe(map((collection) => collection.boardList.map((board) => ({ id: board.id, title: board.title }))));
  }

  selectBoard(boardId: number): void {
    this.eventService.emitBoardSelectedEvent({ data: boardId });
  }

  findGadgetOnBoard(query: string): Observable<IGadget | undefined> {
    const needle = query.trim().toLowerCase();

    return this.boardService.getLastSelectedBoard().pipe(
      map((board) => {
        if (!needle) return undefined;

        for (const row of board.rows) {
          for (const column of row.columns) {
            const found = column.gadgets.find((gadget) => gadget.title.toLowerCase().includes(needle));
            if (found) return found;
          }
        }
        return undefined;
      })
    );
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

  /**
   * Unlike the other action methods, this one can genuinely fail: the model
   * is never told how many rows a board has, so rowIndex is validated here
   * against the real board before emitting anything.
   */
  changeRowLayout(rowIndex: number, structure: LayoutType): Observable<boolean> {
    return this.boardService.getLastSelectedBoard().pipe(
      map((board) => {
        if (rowIndex < 0 || rowIndex >= board.rows.length) return false;
        this.eventService.emitLayoutChange({ data: { structure, rowIndex } });
        return true;
      })
    );
  }

  /**
   * Overlays model-authored property values onto a deep clone of a library
   * gadget template, mirroring the key->value merge
   * LocalStorageBoardRepository.applyProperties already does for post-hoc
   * edits, just applied before the gadget is added rather than after.
   */
  applyPropertyValues(gadget: IGadget, values: Record<string, unknown>): IGadget {
    const merged: IGadget = JSON.parse(JSON.stringify(gadget));

    for (const page of merged.propertyPages ?? []) {
      for (const property of page.properties ?? []) {
        if (Object.prototype.hasOwnProperty.call(values, property.key)) {
          property.value = values[property.key];
        }
      }
    }

    if (typeof values['title'] === 'string') {
      merged.title = values['title'] as string;
    }
    if (typeof values['subtitle'] === 'string') {
      merged.subtitle = values['subtitle'] as string;
    }

    return merged;
  }
}
