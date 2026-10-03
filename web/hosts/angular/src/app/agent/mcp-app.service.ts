import { Injectable } from '@angular/core';
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { SSEClientTransport } from '@modelcontextprotocol/sdk/client/sse.js';
import { from, map, Observable, shareReplay, switchMap } from 'rxjs';
import { loadMcpApp, type McpApp } from '@armature/core';
import { environment } from '../../environments/environment';

export type { McpApp } from '@armature/core';

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

  /** Loads an MCP App by tool name over the shared client (see loadMcpApp in @armature/core). */
  loadApp(toolName: string): Observable<McpApp> {
    return this.connect().pipe(switchMap((client) => from(loadMcpApp(client, toolName))));
  }
}
