import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { SSEClientTransport } from '@modelcontextprotocol/sdk/client/sse.js';
import { loadMcpApp, type McpApp } from '@armature/core';
import { environment } from 'src/environments/environment';

// Armature's own MCP server (armature-ms) runs the SSE transport (see its
// README), not the newer Streamable HTTP one, so SSEClientTransport is the
// correct client here despite being deprecated upstream in favor of
// StreamableHTTPClientTransport; that recommendation is for new servers.
let connected: Promise<Client> | undefined;

/**
 * One connected MCP client for the whole app (armature-ui's McpAppService
 * shares it the same way), so every app viewer reuses one SSE session to
 * armature-ms. A failed connection is forgotten so the next viewer retries.
 */
function connect(): Promise<Client> {
  if (!connected) {
    const client = new Client({ name: 'Armature', version: '1.0.0' });
    connected = client
      .connect(new SSEClientTransport(new URL(`${environment.apihost}/sse`)))
      .then(() => client)
      .catch((err: unknown) => {
        connected = undefined;
        throw err;
      });
  }
  return connected;
}

/** Loads an MCP App by tool name over the shared client (see loadMcpApp in @armature/core). */
export async function loadApp(toolName: string): Promise<McpApp> {
  return loadMcpApp(await connect(), toolName);
}
