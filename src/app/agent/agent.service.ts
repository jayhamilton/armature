import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { combineLatest, Observable, switchMap } from 'rxjs';
import { environment } from '../../environments/environment';
import { BoardService } from '../board/board.service';
import { LibraryService } from '../library/library.service';
import { IPropertyPage } from '../gadgets/common/gadget-common/gadget-base/gadget.model';

export interface AgentGadgetLibraryEntry {
  componentType: string;
  title: string;
  subtitle: string;
  description: string;
  propertyPages: IPropertyPage[];
}

export interface AgentRequest {
  message: string;
  boardContext?: {
    boardId?: number;
    boardTitle?: string;
    activeTab?: string;
  };
  gadgetLibrary?: AgentGadgetLibraryEntry[];
}

export interface ToolCall {
  name: string;
  arguments: string;
}

export interface AgentUiPart {
  id: number;
  type: 'text' | 'component' | 'iframe';
  text?: string;
  componentType?: string;
  payload?: unknown;
  title?: string;
  src?: string;
}

export interface AgentResponse {
  message: string;
  toolCalls: ToolCall[];
  parts?: AgentUiPart[];
}

@Injectable({ providedIn: 'root' })
export class AgentService {
  constructor(
    private http: HttpClient,
    private boardService: BoardService,
    private libraryService: LibraryService
  ) {}

  chat(message: string): Observable<AgentResponse> {
    return combineLatest([this.boardService.getLastSelectedBoard(), this.libraryService.getLibrary()]).pipe(
      switchMap(([board, library]) => {
        const request: AgentRequest = {
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
        };

        return this.http.post<AgentResponse>(`${environment.apihost}/api/agent/chat`, request);
      })
    );
  }
}
