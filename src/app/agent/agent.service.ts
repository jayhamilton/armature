import { Injectable } from '@angular/core';
import { HttpClient, HttpEventType, HttpHeaders, HttpResponse } from '@angular/common/http';
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

export interface AgentBoardGadgetEntry {
  instanceId: number;
  title: string;
}

export interface AgentRequest {
  message: string;
  boardContext?: {
    boardId?: number;
    boardTitle?: string;
    activeTab?: string;
  };
  gadgetLibrary?: AgentGadgetLibraryEntry[];
  boardGadgets?: AgentBoardGadgetEntry[];
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

// A hand-rolled subset of AG-UI's event envelope, matching the Java records in
// com.addf.backend.armature.agent.agui field-for-field. No official AG-UI Java SDK
// is published anywhere resolvable (checked directly against Maven Central), so the
// backend emits plain JSON shaped like this rather than a dependency's wire format.
export type AgUiEvent =
  | { type: 'RUN_STARTED'; threadId: string; runId: string }
  | { type: 'RUN_FINISHED'; threadId: string; runId: string }
  | { type: 'RUN_ERROR'; message: string }
  | { type: 'TEXT_MESSAGE_START'; messageId: string }
  | { type: 'TEXT_MESSAGE_CONTENT'; messageId: string; delta: string }
  | { type: 'TEXT_MESSAGE_END'; messageId: string }
  | { type: 'TOOL_CALL_START'; toolCallId: string; toolCallName: string }
  | { type: 'TOOL_CALL_ARGS'; toolCallId: string; delta: string }
  | { type: 'TOOL_CALL_END'; toolCallId: string }
  | { type: 'CUSTOM'; name: string; value: unknown };

@Injectable({ providedIn: 'root' })
export class AgentService {
  constructor(
    private http: HttpClient,
    private boardService: BoardService,
    private libraryService: LibraryService
  ) {}

  /**
   * Streams the AG-UI event sequence for a chat message. Deliberately goes through
   * HttpClient rather than a raw fetch()/EventSource - the app's TokenInterceptor
   * (app.interceptor.ts) attaches auth headers to every HttpClient request, and a
   * hand-rolled fetch() would silently bypass it. The native EventSource API can't be
   * used either way, since it's GET-only and this needs a JSON POST body.
   *
   * HttpClient exposes a streaming text response's growing body via
   * HttpEventType.DownloadProgress's `partialText` (only present when
   * responseType: 'text'). Each tick re-delivers everything received so far, so a
   * cursor tracks how much has already been parsed into complete "data: {...}\n\n"
   * frames; a frame straddling two ticks is simply left for the next one.
   */
  chatStream(message: string): Observable<AgUiEvent> {
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
          // Grounds move_gadget/remove_gadget's gadgetQuery in real titles, the same way
          // gadgetLibrary grounds add_gadget's componentType - board already has this,
          // no separate fetch needed.
          boardGadgets: (board?.rows ?? []).flatMap((row) =>
            row.columns.flatMap((column) =>
              column.gadgets.map((gadget) => ({ instanceId: gadget.instanceId, title: gadget.title }))
            )
          ),
        };

        return new Observable<AgUiEvent>((subscriber) => {
          let cursor = 0;

          const parseNewFrames = (text: string) => {
            const unparsed = text.slice(cursor);
            const frames = unparsed.split('\n\n');
            // The last split segment is either empty (text ended exactly on a frame
            // boundary) or a partial frame still arriving - don't consume it yet.
            const complete = frames.slice(0, -1);
            let consumedLength = 0;
            for (const frame of complete) {
              consumedLength += frame.length + 2;
              const dataLine = frame.split('\n').find((line) => line.startsWith('data:'));
              if (!dataLine) continue;
              try {
                subscriber.next(JSON.parse(dataLine.slice('data:'.length).trim()) as AgUiEvent);
              } catch {
                // Ignore an unparseable frame rather than tearing down the whole stream.
              }
            }
            cursor += consumedLength;
          };

          const subscription = this.http
            .request('POST', `${environment.apihost}/api/agent/chat`, {
              body: request,
              responseType: 'text',
              reportProgress: true,
              observe: 'events',
              // The endpoint only produces text/event-stream - without this,
              // TokenInterceptor's default Accept: application/json (for any
              // logged-in user) makes Spring's content negotiation 406 the request.
              headers: new HttpHeaders({ Accept: 'text/event-stream' }),
            })
            .subscribe({
              next: (event) => {
                if (event.type === HttpEventType.DownloadProgress && typeof (event as any).partialText === 'string') {
                  parseNewFrames((event as any).partialText);
                } else if (event instanceof HttpResponse && typeof event.body === 'string') {
                  parseNewFrames(event.body);
                }
              },
              error: (err) => subscriber.error(err),
              complete: () => subscriber.complete(),
            });

          return () => subscription.unsubscribe();
        });
      })
    );
  }
}
