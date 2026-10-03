import assert from "node:assert/strict";
import { describe, it } from "node:test";

import type { AgUiEvent } from "./ag-ui.js";
import { AgentChatError, streamChat } from "./agent-client.js";

/** A `fetch` that answers with the given body chunks, and records the request it got. */
function stubFetch(chunks: string[], status = 200) {
  const calls: { url: string; init: RequestInit }[] = [];
  const fetchStub = (async (url: string, init: RequestInit) => {
    calls.push({ url, init });
    const encoder = new TextEncoder();
    const body = new ReadableStream<Uint8Array>({
      start(controller) {
        chunks.forEach((chunk) => controller.enqueue(encoder.encode(chunk)));
        controller.close();
      },
    });
    return new Response(body, { status });
  }) as unknown as typeof fetch;
  return { fetchStub, calls };
}

async function collect(stream: AsyncIterable<AgUiEvent>): Promise<AgUiEvent[]> {
  const events: AgUiEvent[] = [];
  for await (const event of stream) events.push(event);
  return events;
}

describe("streamChat", () => {
  it("POSTs the request with the host's headers and asks for an event stream", async () => {
    const { fetchStub, calls } = stubFetch([]);

    await collect(
      streamChat(
        { message: "hi" },
        { baseUrl: "http://api", headers: () => ({ Authorization: "token-1" }), fetch: fetchStub },
      ),
    );

    assert.equal(calls.length, 1);
    const [call] = calls;
    assert.equal(call?.url, "http://api/api/agent/chat");
    assert.equal(call?.init.method, "POST");
    assert.deepEqual(call?.init.headers, {
      Authorization: "token-1",
      "Content-Type": "application/json",
      Accept: "text/event-stream",
    });
    assert.deepEqual(JSON.parse(call?.init.body as string), { message: "hi" });
  });

  it("yields events as frames arrive, including one split across chunks", async () => {
    const { fetchStub } = stubFetch([
      'data: {"type":"RUN_STARTED","threadId":"t","runId":"r"}\n\ndata: {"type":"TEXT_MESSAGE_CON',
      'TENT","messageId":"m","delta":"Hi"}\n\n',
      'data: {"type":"RUN_FINISHED","threadId":"t","runId":"r"}\n\n',
    ]);

    const events = await collect(streamChat({ message: "hi" }, { baseUrl: "", fetch: fetchStub }));

    assert.deepEqual(
      events.map((e) => e.type),
      ["RUN_STARTED", "TEXT_MESSAGE_CONTENT", "RUN_FINISHED"],
    );
  });

  it("delivers a last frame that has no closing blank line", async () => {
    const { fetchStub } = stubFetch(['data: {"type":"RUN_ERROR","message":"boom"}']);

    const events = await collect(streamChat({ message: "hi" }, { baseUrl: "", fetch: fetchStub }));

    assert.deepEqual(events, [{ type: "RUN_ERROR", message: "boom" }]);
  });

  it("throws AgentChatError with the status for a non 2xx response", async () => {
    const { fetchStub } = stubFetch([], 406);

    await assert.rejects(
      collect(streamChat({ message: "hi" }, { baseUrl: "", fetch: fetchStub })),
      (err: unknown) => err instanceof AgentChatError && err.status === 406,
    );
  });
});
