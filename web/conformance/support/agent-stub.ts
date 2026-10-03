import { readFileSync } from 'node:fs';
import type { Page } from '@playwright/test';
import { API_ORIGIN } from './backend-stub';

/** The name of an AG-UI event sequence in `fixtures/agui/`. */
export type AgUiFixture =
  | 'reply-text'
  | 'add-gadget'
  | 'board-list'
  | 'move-gadget'
  | 'remove-gadget'
  | 'remove-missing-gadget'
  | 'add-row'
  | 'row-layout-missing-row'
  | 'run-error';

/** What a host sent to `/api/agent/chat`. */
export interface AgentChatRequest {
  message: string;
  boardContext?: { boardId?: number; boardTitle?: string };
  gadgetLibrary?: { componentType: string; title: string }[];
  boardGadgets?: { instanceId: number; title: string; componentType: string }[];
}

function fixture(name: AgUiFixture): unknown[] {
  return JSON.parse(readFileSync(new URL(`../fixtures/agui/${name}.json`, import.meta.url), 'utf8'));
}

/**
 * Answers the next chat requests with the given AG-UI fixtures, in order, as
 * the server sent events armature-ms sends (`data:{json}` frames, as Spring's
 * SseEmitter writes them). Call after `stubBackend`, so this route wins.
 * Returns the requests the host made, for checking what it sent.
 */
export async function stubAgentChat(page: Page, ...replies: AgUiFixture[]): Promise<AgentChatRequest[]> {
  const requests: AgentChatRequest[] = [];
  await page.route(`${API_ORIGIN}/api/agent/chat`, async (route) => {
    const request = route.request();
    requests.push(request.postDataJSON());
    const reply = replies[requests.length - 1];
    if (!reply) return route.fulfill({ status: 500 });
    await route.fulfill({
      status: 200,
      contentType: 'text/event-stream',
      body: fixture(reply)
        .map((event) => `data:${JSON.stringify(event)}\n\n`)
        .join(''),
    });
  });
  return requests;
}
