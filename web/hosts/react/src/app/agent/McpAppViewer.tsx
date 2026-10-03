import { useEffect, useRef, useState } from 'react';
import { mountMcpApp } from '@armature/core';
import { loadApp } from '../mcp-apps/mcpClient';

/**
 * Renders one MCP App (SEP-1865) in a sandboxed iframe, ported from
 * armature-ui's McpAppViewerComponent. Loading and the AppBridge handshake
 * are shared with every host in @armature/core (loadMcpApp, mountMcpApp,
 * which also explains the single iframe sandbox); this component only owns
 * the iframe and shows the error or the ready view.
 */
export function McpAppViewer({ toolName }: { toolName: string }) {
  const frameRef = useRef<HTMLIFrameElement>(null);
  const [ready, setReady] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string>();

  useEffect(() => {
    let unmount: (() => void) | undefined;
    let cancelled = false;
    const fail = (err: unknown) => {
      if (!cancelled) setErrorMessage(err instanceof Error ? err.message : String(err));
    };

    loadApp(toolName).then((app) => {
      const frame = frameRef.current;
      if (cancelled || !frame) return;
      unmount = mountMcpApp(frame, app, {
        onReady: () => {
          if (!cancelled) setReady(true);
        },
        onError: fail,
      });
    }, fail);

    return () => {
      cancelled = true;
      unmount?.();
    };
  }, [toolName]);

  return (
    <div className="mcp-app-viewer">
      {errorMessage && <p className="mcp-app-viewer__error">Couldn't load this app: {errorMessage}</p>}
      <iframe
        ref={frameRef}
        className={['mcp-app-viewer__frame', ready ? '' : 'mcp-app-viewer__frame--hidden'].filter(Boolean).join(' ')}
        sandbox="allow-scripts"
        title="MCP App"
      />
    </div>
  );
}
