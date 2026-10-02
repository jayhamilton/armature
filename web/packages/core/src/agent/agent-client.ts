import type { AgentRequest, AgUiEvent } from "./ag-ui.js";
import { SseFrameParser } from "./sse-frame-parser.js";

export interface StreamChatOptions {
  /** The backend origin, for example `http://localhost:8080`. */
  baseUrl: string;
  /**
   * Extra headers for each request, called once per request. Hosts pass their auth here
   * (`Authorization`), because a plain `fetch` does not go through a host's HTTP interceptors.
   */
  headers?: () => Record<string, string>;
  /** Cancels the request and ends the stream, for example when the panel closes. */
  signal?: AbortSignal;
  /** The `fetch` to use; tests pass a stub. Defaults to the global `fetch`. */
  fetch?: typeof fetch;
}

/** Thrown when `/api/agent/chat` answers with a status other than 2xx. */
export class AgentChatError extends Error {
  constructor(readonly status: number) {
    super(`POST /api/agent/chat failed with ${status}`);
    this.name = "AgentChatError";
  }
}

/**
 * Sends one chat message and yields the AG-UI events of the run as they arrive.
 *
 * Uses `fetch` and the response body stream rather than `EventSource`, which can only send GET
 * requests and this endpoint takes a JSON body. `Accept: text/event-stream` is required: the
 * endpoint produces nothing else, and Spring answers 406 to `Accept: application/json`.
 *
 * @throws AgentChatError for a non 2xx response; network errors and aborts propagate as thrown
 *   by `fetch`.
 */
export async function* streamChat(
  request: AgentRequest,
  options: StreamChatOptions,
): AsyncGenerator<AgUiEvent> {
  const doFetch = options.fetch ?? fetch;
  const response = await doFetch(`${options.baseUrl}/api/agent/chat`, {
    method: "POST",
    headers: {
      ...options.headers?.(),
      "Content-Type": "application/json",
      Accept: "text/event-stream",
    },
    body: JSON.stringify(request),
    signal: options.signal,
  });
  if (!response.ok) {
    throw new AgentChatError(response.status);
  }
  if (!response.body) return;

  const parser = new SseFrameParser();
  const reader = response.body.pipeThrough(new TextDecoderStream()).getReader();
  try {
    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;
      for (const event of parser.push(value)) {
        yield event as AgUiEvent;
      }
    }
    // A stream that ends without a final blank line still delivers its last frame.
    for (const event of parser.push("\n\n")) {
      yield event as AgUiEvent;
    }
  } finally {
    reader.releaseLock();
  }
}
