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
import { mountMcpApp, type McpApp } from '@armature/core';
import { McpAppService } from './mcp-app.service';

/**
 * Renders one MCP App (SEP-1865) in a sandboxed iframe. Loading and the AppBridge
 * handshake are shared with every host in @armature/core (loadMcpApp, mountMcpApp,
 * which also explains the single iframe sandbox); this component only owns the
 * iframe and shows the error or the ready view.
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

  private unmount?: () => void;

  constructor(
    private mcpAppService: McpAppService,
    private cdr: ChangeDetectorRef
  ) {}

  ngAfterViewInit(): void {
    this.mcpAppService.loadApp(this.toolName).subscribe({
      next: (app) => this.mountApp(app),
      error: (err) => this.setError(err),
    });
  }

  private mountApp(app: McpApp) {
    const frame = this.frameRef?.nativeElement;
    if (!frame) return;

    this.unmount = mountMcpApp(frame, app, {
      onReady: () => {
        this.ready = true;
        this.cdr.markForCheck();
      },
      onError: (err) => this.setError(err),
    });
  }

  private setError(err: unknown) {
    this.errorMessage = err instanceof Error ? err.message : String(err);
    this.cdr.markForCheck();
  }

  ngOnDestroy(): void {
    this.unmount?.();
  }
}
