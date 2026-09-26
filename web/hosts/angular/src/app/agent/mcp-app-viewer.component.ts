import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  ElementRef,
  Input,
  OnDestroy,
  AfterViewInit,
  ViewChild,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { AppBridge, PostMessageTransport } from '@modelcontextprotocol/ext-apps/app-bridge';
import type { Client } from '@modelcontextprotocol/sdk/client/index.js';
import type { CallToolResult } from '@modelcontextprotocol/sdk/types.js';
import { McpAppService } from './mcp-app.service';

/**
 * Renders one MCP App (SEP-1865): a sandboxed iframe hosting the tool's ui://
 * resource, wired up with the official AppBridge so the view gets a real
 * ui/initialize handshake and its tool result, exactly like a first-class MCP
 * Apps host (Claude Desktop, etc.) would do it - not a bespoke shortcut.
 *
 * Single-iframe sandboxing (`sandbox="allow-scripts"`, no `allow-same-origin`,
 * loaded via srcdoc) rather than the reference double-iframe proxy architecture:
 * a deliberate scope call appropriate for today's only source, Armature's own
 * armature-ms - the double-iframe pattern exists to isolate a host from
 * *third-party* server content, which nothing here consumes yet. Revisit before
 * ever pointing this at a server this app doesn't control.
 */
@Component({
  selector: 'app-mcp-app-viewer',
  standalone: true,
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="mcp-app-viewer">
      @if (errorMessage) {
        <p class="mcp-app-viewer__error">Couldn't load this app: {{ errorMessage }}</p>
      }
      <iframe
        #frame
        class="mcp-app-viewer__frame"
        [class.mcp-app-viewer__frame--hidden]="!ready"
        sandbox="allow-scripts"
        title="MCP App"
      ></iframe>
    </div>
  `,
  styles: [
    // Custom elements default to display: inline, so without this the host
    // just sits flush against whatever text precedes it - the other part
    // types get their margin-top from the .agent-panel__component-card
    // wrapper they're rendered inside; this one isn't wrapped in one, so it
    // needs its own spacing instead of relying on the parent panel's CSS.
    `:host { display: block; margin-top: 8px; }`,
    `.mcp-app-viewer { display: flex; flex-direction: column; }`,
    `.mcp-app-viewer__error { font-size: 0.85rem; color: var(--app-text-secondary, #666); }`,
    `.mcp-app-viewer__frame { width: 100%; min-height: 200px; border: 1px solid var(--app-border, #ddd); border-radius: 8px; }`,
    `.mcp-app-viewer__frame--hidden { display: none; }`,
  ],
})
export class McpAppViewerComponent implements AfterViewInit, OnDestroy {
  @Input({ required: true }) toolName!: string;

  @ViewChild('frame') private frameRef?: ElementRef<HTMLIFrameElement>;

  ready = false;
  errorMessage?: string;

  private bridge?: AppBridge;
  private loadListener?: () => void;

  constructor(
    private mcpAppService: McpAppService,
    private cdr: ChangeDetectorRef
  ) {}

  ngAfterViewInit(): void {
    this.mcpAppService.loadApp(this.toolName).subscribe({
      next: ({ client, html, result }) => this.mountApp(client, html, result),
      error: (err) => this.setError(err),
    });
  }

  private mountApp(client: Client, html: string, result: CallToolResult) {
    const frame = this.frameRef?.nativeElement;
    if (!frame) return;

    this.loadListener = () => {
      const contentWindow = frame.contentWindow;
      if (!contentWindow) return;

      const bridge = new AppBridge(client, { name: 'Armature', version: '1.0.0' }, {});
      this.bridge = bridge;
      bridge.oninitialized = () => {
        bridge.sendToolInput({ arguments: {} });
        bridge.sendToolResult(result);
        this.ready = true;
        this.cdr.markForCheck();
      };
      bridge.onerror = (err: unknown) => this.setError(err);
      // The view's App instance defaults to autoResize: true (a ResizeObserver on
      // its own document), sending ui/notifications/size-changed on its own -
      // without a host-side listener that just goes nowhere and the iframe stays
      // at the CSS min-height fallback, forcing an inner scrollbar for any content
      // taller than that.
      bridge.addEventListener('sizechange', ({ height }) => {
        if (height != null) {
          frame.style.height = `${height}px`;
        }
      });

      const transport = new PostMessageTransport(contentWindow, contentWindow);
      bridge.connect(transport).catch((err) => this.setError(err));
    };
    frame.addEventListener('load', this.loadListener, { once: true });
    frame.srcdoc = html;
  }

  private setError(err: unknown) {
    this.errorMessage = err instanceof Error ? err.message : String(err);
    this.cdr.markForCheck();
  }

  ngOnDestroy(): void {
    const frame = this.frameRef?.nativeElement;
    if (frame && this.loadListener) {
      frame.removeEventListener('load', this.loadListener);
    }
    this.bridge?.close();
  }
}
