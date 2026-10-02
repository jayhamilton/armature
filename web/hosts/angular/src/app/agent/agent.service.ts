import { Injectable } from '@angular/core';
import { combineLatest, Observable, switchMap } from 'rxjs';
import { buildAgentRequest, streamChat, type AgUiEvent } from '@armature/core';
import { environment } from '../../environments/environment';
import { BoardService } from '../board/board.service';
import { LibraryService } from '../library/library.service';

export type { AgentRequest, AgentUiPart, AgUiEvent } from '@armature/core';

@Injectable({ providedIn: 'root' })
export class AgentService {
  constructor(
    private boardService: BoardService,
    private libraryService: LibraryService
  ) {}

  /**
   * Streams the AG-UI events of one chat message, using the shared client in @armature/core.
   * Unsubscribing aborts the request.
   *
   * The core client uses fetch, so the app's TokenInterceptor (which only sees HttpClient
   * requests) does not add auth here; the same Authorization header is passed explicitly instead.
   */
  chatStream(message: string): Observable<AgUiEvent> {
    return combineLatest([this.boardService.getLastSelectedBoard(), this.libraryService.getLibrary()]).pipe(
      switchMap(([board, library]) => {
        const request = buildAgentRequest(message, board, library);

        return new Observable<AgUiEvent>((subscriber) => {
          const abort = new AbortController();
          (async () => {
            for await (const event of streamChat(request, {
              baseUrl: environment.apihost,
              headers: authHeaders,
              signal: abort.signal,
            })) {
              subscriber.next(event);
            }
          })().then(
            () => subscriber.complete(),
            (err) => {
              if (!abort.signal.aborted) subscriber.error(err);
            }
          );
          return () => abort.abort();
        });
      })
    );
  }
}

/** The Authorization header TokenInterceptor would add: the raw session token, when signed in. */
function authHeaders(): Record<string, string> {
  const token = sessionStorage.getItem(environment.sessionToken);
  return token ? { Authorization: token } : {};
}
