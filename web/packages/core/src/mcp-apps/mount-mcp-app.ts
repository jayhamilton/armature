import { AppBridge, PostMessageTransport } from "@modelcontextprotocol/ext-apps/app-bridge";

import type { McpApp } from "./load-mcp-app.js";

export interface MountMcpAppCallbacks {
  /** The view finished its `ui/initialize` handshake and has its tool result. */
  onReady?: () => void;
  onError?: (error: Error) => void;
}

/**
 * Shows a loaded MCP App in an iframe, connected through the official `AppBridge`, so the view
 * gets a real `ui/initialize` handshake and its tool result, as in any first class MCP Apps host.
 *
 * The iframe must have `sandbox="allow-scripts"` and no `allow-same-origin`; the HTML is loaded
 * through `srcdoc`. That single iframe sandbox, rather than the reference double iframe proxy, is
 * a deliberate scope choice for today's only source, Armature's own backend. The double iframe
 * exists to isolate a host from third party server content, which nothing consumes yet. Revisit
 * before pointing this at a server Armature does not control (INC-07).
 *
 * @returns a function that detaches the listener and closes the bridge; call it when the iframe
 *   is removed.
 */
export function mountMcpApp(
  frame: HTMLIFrameElement,
  app: McpApp,
  callbacks: MountMcpAppCallbacks = {},
): () => void {
  let bridge: AppBridge | undefined;
  const fail = (err: unknown) => callbacks.onError?.(err instanceof Error ? err : new Error(String(err)));

  const onLoad = () => {
    const contentWindow = frame.contentWindow;
    if (!contentWindow) return;

    const connected = new AppBridge(app.client, { name: "Armature", version: "1.0.0" }, {});
    bridge = connected;
    connected.oninitialized = () => {
      connected.sendToolInput({ arguments: {} });
      connected.sendToolResult(app.result);
      callbacks.onReady?.();
    };
    connected.onerror = fail;
    // The view's App resizes itself (autoResize) and reports its height; without this listener
    // the iframe stays at its CSS minimum height and the view scrolls inside it.
    connected.addEventListener("sizechange", ({ height }) => {
      if (height != null) {
        frame.style.height = `${height}px`;
      }
    });

    connected.connect(new PostMessageTransport(contentWindow, contentWindow)).catch(fail);
  };

  frame.addEventListener("load", onLoad, { once: true });
  frame.srcdoc = app.html;

  return () => {
    frame.removeEventListener("load", onLoad);
    void bridge?.close();
  };
}
