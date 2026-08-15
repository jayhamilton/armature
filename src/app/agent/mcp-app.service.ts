import { Injectable } from '@angular/core';
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { SSEClientTransport } from '@modelcontextprotocol/sdk/client/sse.js';
import type { CallToolResult } from '@modelcontextprotocol/sdk/types.js';
import { from, map, Observable, shareReplay, switchMap } from 'rxjs';
import { environment } from '../../environments/environment';

export interface McpApp {
  client: Client;
  html: string;
  result: CallToolResult;
}

// Armature's own MCP server (armature-ms) runs the SSE transport (see its README),
// not the newer Streamable HTTP one, so SSEClientTransport is the correct client
// here despite being marked deprecated upstream in favor of
// StreamableHTTPClientTransport - that recommendation is for new servers, and
// armature-ms hasn't been switched.
@Injectable({ providedIn: 'root' })
export class McpAppService {
  private client$?: Observable<Client>;

  private connect(): Observable<Client> {
    if (!this.client$) {
      const client = new Client({ name: 'Armature', version: '1.0.0' });
      const transport = new SSEClientTransport(new URL(`${environment.apihost}/sse`));
      // shareReplay so every app viewer reuses the same connected client instead
      // of each opening its own SSE session to armature-ms.
      this.client$ = from(client.connect(transport)).pipe(
        map(() => client),
        shareReplay({ bufferSize: 1, refCount: false })
      );
    }
    return this.client$;
  }

  /**
   * Resolves an MCP App by tool name: discovers its ui:// resource via the tool's
   * own _meta.ui.resourceUri (rather than being told the URI out of band), fetches
   * that resource's HTML, and calls the tool for real over MCP to get fresh
   * structuredContent - the same three-step flow any MCP Apps host follows,
   * so this works for any future MCP-App-backed tool, not just this one.
   */
  loadApp(toolName: string): Observable<McpApp> {
    return this.connect().pipe(
      switchMap((client) =>
        from(
          (async (): Promise<McpApp> => {
            const { tools } = await client.listTools();
            const tool = tools.find((t) => t.name === toolName);
            const ui = (tool?._meta as Record<string, unknown> | undefined)?.['ui'] as
              | { resourceUri?: string }
              | undefined;
            const resourceUri = ui?.resourceUri;
            if (!resourceUri) {
              throw new Error(`Tool "${toolName}" has no ui.resourceUri in its _meta - not an MCP App.`);
            }

            const resource = await client.readResource({ uri: resourceUri });
            const content = resource.contents[0];
            if (!content || !('text' in content) || typeof content.text !== 'string') {
              throw new Error(`Resource "${resourceUri}" returned no HTML text content.`);
            }

            const result = await client.callTool({ name: toolName, arguments: {} });
            return { client, html: content.text, result: result as CallToolResult };
          })()
        )
      )
    );
  }
}
