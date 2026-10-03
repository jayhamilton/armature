import type { Client } from "@modelcontextprotocol/sdk/client/index.js";
import type { CallToolResult } from "@modelcontextprotocol/sdk/types.js";

/** Everything needed to show an MCP App: the client it came from, its HTML, and a tool result. */
export interface McpApp {
  client: Client;
  html: string;
  result: CallToolResult;
}

/** The methods of an MCP `Client` this module uses, so tests can pass a fake. */
export type McpAppClient = Pick<Client, "listTools" | "readResource" | "callTool">;

/**
 * Loads an MCP App (SEP-1865) by tool name, in the three steps every MCP Apps host follows:
 *
 * 1. Find the tool's `ui://` resource in its own `_meta.ui.resourceUri`, rather than being told
 *    the URI out of band, so this works for any tool that ships an app.
 * 2. Read that resource's HTML.
 * 3. Call the tool for real, to get fresh `structuredContent` for the view.
 *
 * @throws Error if the tool has no `ui.resourceUri` or the resource has no HTML text.
 */
export async function loadMcpApp(client: McpAppClient, toolName: string): Promise<McpApp> {
  const { tools } = await client.listTools();
  const tool = tools.find((t) => t.name === toolName);
  const ui = (tool?._meta as Record<string, unknown> | undefined)?.["ui"] as
    | { resourceUri?: string }
    | undefined;
  const resourceUri = ui?.resourceUri;
  if (!resourceUri) {
    throw new Error(`Tool "${toolName}" has no ui.resourceUri in its _meta, so it is not an MCP App.`);
  }

  const resource = await client.readResource({ uri: resourceUri });
  const content = resource.contents[0];
  if (!content || !("text" in content) || typeof content.text !== "string") {
    throw new Error(`Resource "${resourceUri}" returned no HTML text content.`);
  }

  const result = await client.callTool({ name: toolName, arguments: {} });
  return { client: client as Client, html: content.text, result: result as CallToolResult };
}
