import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { loadMcpApp, type McpAppClient } from "./load-mcp-app.js";

/** A fake MCP client with one tool, optionally carrying a ui resource, and the calls it got. */
function fakeClient(options: { resourceUri?: string; html?: string }) {
  const calls: string[] = [];
  const client = {
    async listTools() {
      calls.push("listTools");
      return {
        tools: [
          {
            name: "board_summary",
            inputSchema: { type: "object" as const },
            _meta: options.resourceUri ? { ui: { resourceUri: options.resourceUri } } : undefined,
          },
        ],
      };
    },
    async readResource({ uri }: { uri: string }) {
      calls.push(`readResource ${uri}`);
      return { contents: options.html === undefined ? [] : [{ uri, text: options.html }] };
    },
    async callTool({ name }: { name: string }) {
      calls.push(`callTool ${name}`);
      return { content: [], structuredContent: { boards: 3 } };
    },
  } as unknown as McpAppClient;
  return { client, calls };
}

describe("loadMcpApp", () => {
  it("finds the tool's ui resource, reads its HTML, then calls the tool", async () => {
    const { client, calls } = fakeClient({ resourceUri: "ui://board-summary", html: "<p>app</p>" });

    const app = await loadMcpApp(client, "board_summary");

    assert.equal(app.html, "<p>app</p>");
    assert.deepEqual(app.result.structuredContent, { boards: 3 });
    assert.deepEqual(calls, ["listTools", "readResource ui://board-summary", "callTool board_summary"]);
  });

  it("explains that a tool without ui.resourceUri is not an MCP App", async () => {
    const { client, calls } = fakeClient({});

    await assert.rejects(loadMcpApp(client, "board_summary"), /has no ui\.resourceUri.*not an MCP App/);
    assert.deepEqual(calls, ["listTools"]);
  });

  it("explains that a resource without HTML text cannot be shown", async () => {
    const { client } = fakeClient({ resourceUri: "ui://board-summary" });

    await assert.rejects(loadMcpApp(client, "board_summary"), /returned no HTML text content/);
  });

  it("reports an unknown tool the same way", async () => {
    const { client } = fakeClient({ resourceUri: "ui://x", html: "x" });

    await assert.rejects(loadMcpApp(client, "missing_tool"), /Tool "missing_tool" has no ui\.resourceUri/);
  });
});
