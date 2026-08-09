import { ChangeDetectionStrategy, ChangeDetectorRef, Component, ElementRef, OnDestroy, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { forkJoin, interval, map, Observable, of, Subscription, take } from 'rxjs';
import { AgentService, AgentResponse, AgentUiPart } from './agent.service';
import { AgentActionService, BoardSummary, GadgetMoveDirection } from './agent-action.service';
import { EventService } from '../eventservice/event.service';
import { IGadget } from '../gadgets/common/gadget-common/gadget-base/gadget.model';
import { LayoutType } from '../layout/layout.model';

interface ChatPart extends AgentUiPart {
  gadgetPreview?: IGadget;
  gadgetAdded?: boolean;
  boardSummaries?: BoardSummary[];
  gadgetMoveTarget?: IGadget;
  gadgetMoveQuery?: string;
  direction?: GadgetMoveDirection;
  moved?: boolean;
  gadgetRemoveTarget?: IGadget;
  gadgetRemoveQuery?: string;
  removed?: boolean;
  rowAdded?: boolean;
  rowIndex?: number;
  rowStructure?: LayoutType;
  rowLayoutApplied?: boolean;
}

interface ChatMessage {
  id: number;
  role: 'user' | 'assistant';
  content?: string;
  parts?: ChatPart[];
  toolCalls?: Array<{ name: string; arguments: string }>;
}

@Component({
  selector: 'app-agent-panel',
  standalone: true,
  imports: [CommonModule, FormsModule, MatCardModule, MatInputModule, MatButtonModule, MatIconModule],
  template: `
    <div class="agent-panel">
      <div class="agent-panel__header">
        <div class="agent-panel__header-row">
          <div>
            <h3>Assistant</h3>
            <span>Conversational dashboard helper</span>
          </div>
          @if (voiceOutputSupported) {
            <button
              mat-icon-button
              [class.agent-panel__voice-toggle--active]="readAloud"
              (click)="toggleReadAloud()"
              [attr.aria-pressed]="readAloud"
              [attr.aria-label]="readAloud ? 'Turn off reading replies aloud' : 'Read replies aloud'"
            >
              <mat-icon>{{ readAloud ? 'volume_up' : 'volume_off' }}</mat-icon>
            </button>
          }
        </div>
      </div>

      <div class="agent-panel__conversation" #conversation (scroll)="onConversationScroll()">
        @if (messages.length === 0) {
          <div class="agent-panel__empty-state">
            <p>Ask the dashboard to create boards, add widgets, or explain the current view.</p>
          </div>
        }

        @for (message of messages; track message.id) {
          <div class="agent-panel__message" [class.agent-panel__message--assistant]="message.role === 'assistant'">
            <div class="agent-panel__message-role">{{ message.role === 'assistant' ? 'Assistant' : 'You' }}</div>
            <div class="agent-panel__message-content">
              @if (message.content) {
                <p>{{ message.content }}</p>
              }

              @if (message.parts?.length) {
                @for (part of message.parts; track part.id) {
                  @if (part.type === 'text') {
                    <p>{{ part.text }}</p>
                  }

                  @if (part.type === 'component' && part.componentType === 'gadget-suggestion') {
                    <div class="agent-panel__component-card">
                      <div class="agent-panel__component-label">Suggested gadget</div>
                      @if (part.gadgetPreview) {
                        <div class="agent-panel__gadget-preview">
                          <mat-icon>{{ part.gadgetPreview.icon }}</mat-icon>
                          <div>
                            <div class="agent-panel__gadget-title">{{ part.gadgetPreview.title }}</div>
                            <div class="agent-panel__gadget-subtitle">{{ part.gadgetPreview.subtitle }}</div>
                          </div>
                        </div>
                        <span class="agent-panel__applied-badge">Added ✓</span>
                      } @else {
                        <p>This gadget type isn't in the library.</p>
                      }
                    </div>
                  }

                  @if (part.type === 'component' && part.componentType === 'board-list') {
                    <div class="agent-panel__component-card">
                      <div class="agent-panel__component-label">Your boards</div>
                      @if (part.boardSummaries?.length) {
                        <ul class="agent-panel__board-list">
                          @for (board of part.boardSummaries; track board.id) {
                            <li>
                              <span>{{ board.title }}</span>
                              <button mat-button (click)="switchBoard(board.id)">Switch</button>
                            </li>
                          }
                        </ul>
                      } @else {
                        <p>No boards found yet.</p>
                      }
                    </div>
                  }

                  @if (part.type === 'component' && part.componentType === 'gadget-move') {
                    <div class="agent-panel__component-card">
                      <div class="agent-panel__component-label">Move gadget</div>
                      @if (part.gadgetMoveTarget) {
                        <div class="agent-panel__gadget-preview">
                          <mat-icon>{{ part.gadgetMoveTarget.icon }}</mat-icon>
                          <div>
                            <div class="agent-panel__gadget-title">{{ part.gadgetMoveTarget.title }}</div>
                            <div class="agent-panel__gadget-subtitle">Move {{ part.direction }}</div>
                          </div>
                        </div>
                        <span class="agent-panel__applied-badge">Moved {{ part.direction }} ✓</span>
                      } @else {
                        <p>Couldn't find a gadget matching "{{ part.gadgetMoveQuery }}" on this board.</p>
                      }
                    </div>
                  }

                  @if (part.type === 'component' && part.componentType === 'gadget-remove') {
                    <div class="agent-panel__component-card">
                      <div class="agent-panel__component-label">Remove gadget</div>
                      @if (part.gadgetRemoveTarget) {
                        <div class="agent-panel__gadget-preview">
                          <mat-icon>{{ part.gadgetRemoveTarget.icon }}</mat-icon>
                          <div>
                            <div class="agent-panel__gadget-title">{{ part.gadgetRemoveTarget.title }}</div>
                          </div>
                        </div>
                        <span class="agent-panel__applied-badge">Removed ✓</span>
                      } @else {
                        <p>Couldn't find a gadget matching "{{ part.gadgetRemoveQuery }}" on this board.</p>
                      }
                    </div>
                  }

                  @if (part.type === 'component' && part.componentType === 'row-add') {
                    <div class="agent-panel__component-card">
                      <div class="agent-panel__component-label">Add row</div>
                      <span class="agent-panel__applied-badge">Row added ✓</span>
                    </div>
                  }

                  @if (part.type === 'component' && part.componentType === 'row-layout') {
                    <div class="agent-panel__component-card">
                      <div class="agent-panel__component-label">Row layout</div>
                      @if (part.rowLayoutApplied) {
                        <span class="agent-panel__applied-badge">
                          Row {{ (part.rowIndex ?? 0) + 1 }} set to {{ part.rowStructure }} ✓
                        </span>
                      } @else {
                        <p>Couldn't find row {{ (part.rowIndex ?? 0) + 1 }} on this board.</p>
                      }
                    </div>
                  }

                  @if (part.type === 'component' && part.componentType === 'a2ui-card') {
                    <div class="agent-panel__component-card">
                      <div class="agent-panel__component-label">{{ parsedPayload(part)?.title }}</div>
                      <p>{{ parsedPayload(part)?.summary }}</p>
                    </div>
                  }

                  @if (part.type === 'iframe') {
                    <div class="agent-panel__iframe-card">
                      <div class="agent-panel__component-label">{{ part.title }}</div>
                      <iframe [src]="part.src" title="{{ part.title }}"></iframe>
                    </div>
                  }
                }
              }

              @if (message.toolCalls?.length) {
                <div class="agent-panel__tools">
                  <div class="agent-panel__response-title">Tools</div>
                  <ul>
                    @for (tool of message.toolCalls; track tool.name) {
                      <li>{{ tool.name }} → {{ tool.arguments }}</li>
                    }
                  </ul>
                </div>
              }
            </div>
          </div>
        }

        @if (sending) {
          <div class="agent-panel__message agent-panel__message--assistant">
            <div class="agent-panel__message-role">Assistant</div>
            <div class="agent-panel__typing" aria-label="Assistant is working">
              @for (scale of typingDotScales; track $index) {
                <span [style.transform]="'scale(' + scale + ')'" [style.opacity]="scale"></span>
              }
            </div>
          </div>
        }
      </div>

      @if (newReplyAvailable) {
        <button class="agent-panel__jump-latest" mat-stroked-button (click)="jumpToLatest()">
          <mat-icon>arrow_downward</mat-icon> New reply
        </button>
      }

      <div class="agent-panel__composer">
        <mat-form-field appearance="outline" class="agent-panel__input">
          <mat-label>Ask the dashboard</mat-label>
          <textarea
            matInput
            rows="5"
            [(ngModel)]="prompt"
            [disabled]="sending"
            (keyup.enter)="send()"
          ></textarea>
        </mat-form-field>

        <div class="agent-panel__composer-actions">
          @if (voiceInputSupported) {
            <button
              mat-icon-button
              class="agent-panel__mic"
              [class.agent-panel__mic--active]="listening"
              [disabled]="sending"
              (click)="toggleListening()"
              [attr.aria-pressed]="listening"
              [attr.aria-label]="listening ? 'Stop voice input' : 'Start voice input'"
            >
              <mat-icon>{{ listening ? 'mic' : 'mic_none' }}</mat-icon>
            </button>
          }

          <button
            mat-icon-button
            class="agent-panel__send"
            [disabled]="sending"
            (click)="send()"
            aria-label="Send message"
          >
            <mat-icon>send</mat-icon>
          </button>
        </div>
      </div>
    </div>
  `,
  styles: [
    `:host { display: block; height: 100%; padding: 16px; box-sizing: border-box; }`,
    `.agent-panel { display: flex; flex-direction: column; gap: 12px; height: 100%; }`,
    `.agent-panel__header { display: flex; flex-direction: column; gap: 4px; }`,
    `.agent-panel__header-row { display: flex; align-items: flex-start; justify-content: space-between; gap: 8px; }`,
    `.agent-panel__header h3 { margin: 0; font-size: 1.1rem; }`,
    `.agent-panel__header span { color: var(--app-text-secondary); font-size: 0.9rem; }`,
    `.agent-panel__voice-toggle--active { color: var(--app-brand); }`,
    `.agent-panel__conversation { flex: 1; display: flex; flex-direction: column; gap: 12px; overflow: auto; padding-right: 4px; }`,
    `.agent-panel__composer { display: flex; flex-direction: column; gap: 8px; }`,
    `.agent-panel__input { width: 100%; }`,
    `.agent-panel__empty-state, .agent-panel__message { border: 1px solid var(--app-border); border-radius: 12px; padding: 12px; background: var(--app-surface); }`,
    `.agent-panel__message--assistant { background: var(--app-brand-tint); border-color: var(--app-brand-tint-strong); }`,
    `.agent-panel__message-role { font-weight: 600; margin-bottom: 6px; }`,
    `.agent-panel__message-content p { margin: 0; white-space: pre-wrap; }`,
    `.agent-panel__response-title { font-weight: 600; margin-bottom: 6px; }`,
    `.agent-panel__tools { margin-top: 8px; }`,
    `.agent-panel__component-card, .agent-panel__iframe-card { margin-top: 8px; border: 1px solid var(--app-border); border-radius: 8px; padding: 10px; background: var(--app-background); }`,
    `.agent-panel__component-label { font-size: 0.8rem; font-weight: 600; text-transform: uppercase; letter-spacing: 0.04em; color: var(--app-text-secondary); margin-bottom: 6px; }`,
    `.agent-panel__gadget-preview { display: flex; align-items: center; gap: 10px; margin-bottom: 10px; }`,
    `.agent-panel__gadget-title { font-weight: 600; }`,
    `.agent-panel__gadget-subtitle { color: var(--app-text-secondary); font-size: 0.85rem; }`,
    `.agent-panel__applied-badge { color: var(--app-text-secondary); font-size: 0.85rem; font-weight: 600; }`,
    `.agent-panel__board-list { list-style: none; margin: 0; padding: 0; display: flex; flex-direction: column; gap: 6px; }`,
    `.agent-panel__board-list li { display: flex; align-items: center; justify-content: space-between; gap: 8px; }`,
    `.agent-panel__iframe-card iframe { width: 100%; min-height: 220px; border: 0; border-radius: 8px; background: white; }`,
    `.agent-panel__empty-state p { margin: 0; color: var(--app-text-secondary); }`,
    `.agent-panel__typing { display: flex; gap: 4px; align-items: center; height: 20px; }`,
    // Scale/opacity are randomized in the component on an interval rather than
    // via a repeating @keyframes loop, so the motion doesn't visibly cycle -
    // the transition here just smooths each jump into the next one.
    `.agent-panel__typing span { width: 6px; height: 6px; border-radius: 50%; background: var(--app-text-secondary); transition: transform 260ms ease, opacity 260ms ease; }`,
    `.agent-panel__jump-latest { align-self: center; font-size: 0.85rem; }`,
    `.agent-panel__composer-actions { display: flex; gap: 8px; align-self: flex-end; }`,
    `.agent-panel__send { width: 44px; height: 44px; min-width: 44px; min-height: 44px; padding: 0; border-radius: 50%; background: var(--app-brand); color: var(--app-brand-contrast); box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2); display: inline-flex; align-items: center; justify-content: center; line-height: 1; }`,
    `.agent-panel__send:hover { background: var(--app-brand-tint-strong); color: var(--app-brand); }`,
    `.agent-panel__send mat-icon { display: flex; align-items: center; justify-content: center; font-size: 20px; width: 20px; height: 20px; }`,
    `.agent-panel__mic { width: 44px; height: 44px; min-width: 44px; min-height: 44px; padding: 0; border-radius: 50%; border: 1px solid var(--app-border); display: inline-flex; align-items: center; justify-content: center; line-height: 1; color: var(--app-text-secondary); }`,
    `.agent-panel__mic--active { color: #d32f2f; border-color: #d32f2f; animation: agent-panel-mic-pulse 1.2s infinite ease-in-out; }`,
    `@keyframes agent-panel-mic-pulse { 0%, 100% { box-shadow: 0 0 0 0 rgba(211, 47, 47, 0.35); } 50% { box-shadow: 0 0 0 6px rgba(211, 47, 47, 0); } }`
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AgentPanelComponent implements OnDestroy {
  @ViewChild('conversation') private conversationRef?: ElementRef<HTMLDivElement>;

  prompt = '';
  messages: ChatMessage[] = [];
  sending = false;

  typingDotScales: number[] = [0.5, 0.5, 0.5, 0.5];
  private typingAnimationSub?: Subscription;

  // Tracks whether the user is following along at the bottom of the
  // conversation; a reply lands with an auto-scroll if so, or leaves a "New
  // reply" link if they've scrolled up to read history instead of yanking
  // their view out from under them.
  private userIsNearBottom = true;
  newReplyAvailable = false;

  private readonly speechRecognitionCtor: any =
    (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
  private recognition: any;
  listening = false;
  readonly voiceInputSupported = !!this.speechRecognitionCtor;

  readAloud = false;
  readonly voiceOutputSupported = 'speechSynthesis' in window;

  constructor(
    private agentService: AgentService,
    private agentActionService: AgentActionService,
    private eventService: EventService,
    private cdr: ChangeDetectorRef
  ) {
    // The drawer hides this component on close rather than destroying it, so
    // a mic left listening or a reply still being read aloud would otherwise
    // keep running silently in the background — stop both when the panel closes.
    this.eventService.listenForCloseAgentPanelEvent().subscribe(() => {
      this.recognition?.stop();
      if (this.voiceOutputSupported) {
        window.speechSynthesis.cancel();
      }
    });
  }

  ngOnDestroy() {
    this.recognition?.stop();
    if (this.voiceOutputSupported) {
      window.speechSynthesis.cancel();
    }
    this.typingAnimationSub?.unsubscribe();
  }

  toggleListening() {
    if (!this.voiceInputSupported || this.sending) return;

    if (this.listening) {
      this.recognition?.stop();
      return;
    }

    this.recognition = new this.speechRecognitionCtor();
    this.recognition.lang = 'en-US';
    this.recognition.interimResults = true;
    this.recognition.continuous = false;

    this.recognition.onresult = (event: any) => {
      let transcript = '';
      for (let i = 0; i < event.results.length; i++) {
        transcript += event.results[i][0].transcript;
      }
      this.prompt = transcript;
      this.cdr.markForCheck();
    };

    this.recognition.onend = () => {
      this.listening = false;
      this.cdr.markForCheck();
    };

    this.recognition.onerror = () => {
      this.listening = false;
      this.cdr.markForCheck();
    };

    this.listening = true;
    this.recognition.start();
  }

  toggleReadAloud() {
    this.readAloud = !this.readAloud;
    if (!this.readAloud) {
      window.speechSynthesis.cancel();
    }
  }

  private speak(text: string) {
    if (!this.readAloud || !this.voiceOutputSupported || !text) return;
    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(new SpeechSynthesisUtterance(text));
  }

  send() {
    if (!this.prompt.trim() || this.sending) return;

    const userMessage: ChatMessage = {
      id: Date.now(),
      role: 'user',
      content: this.prompt.trim()
    };

    // Synchronous, inside this click/keyup handler's own template — OnPush
    // repaints this automatically without markForCheck().
    this.messages = [...this.messages, userMessage];
    this.prompt = '';
    this.sending = true;
    this.startTypingAnimation();
    this.scrollToBottom();

    this.agentService.chat(userMessage.content!).subscribe({
      next: (response: AgentResponse) => {
        this.resolveParts(response.parts ?? []).subscribe({
          next: (resolvedParts) => this.revealAssistantMessage(response, resolvedParts),
          error: () => this.showAssistantError(),
        });
      },
      error: () => this.showAssistantError(),
    });
  }

  /**
   * Simulates a streaming reply by revealing response.message word-by-word,
   * then attaching the resolved cards once the text finishes — a stand-in
   * for real token streaming until a live ChatClient backs Phase 2.
   */
  private revealAssistantMessage(response: AgentResponse, resolvedParts: ChatPart[]) {
    const assistantMessage: ChatMessage = { id: Date.now() + 1, role: 'assistant', content: '' };
    this.messages = [...this.messages, assistantMessage];
    this.sending = false;
    this.stopTypingAnimation();
    this.cdr.markForCheck();
    this.landReply();
    this.speak(response.message);

    const words = response.message.split(' ');
    interval(45)
      .pipe(take(words.length))
      .subscribe({
        next: (i) => {
          assistantMessage.content = words.slice(0, i + 1).join(' ');
          this.cdr.markForCheck();
          if (this.userIsNearBottom) {
            this.scrollToBottom();
          }
        },
        complete: () => {
          assistantMessage.parts = resolvedParts;
          assistantMessage.toolCalls = response.toolCalls ?? [];
          this.cdr.markForCheck();
          this.landReply();
        },
      });
  }

  private showAssistantError() {
    this.sending = false;
    this.stopTypingAnimation();
    this.messages = [
      ...this.messages,
      {
        id: Date.now() + 1,
        role: 'assistant',
        content: "Sorry, I couldn't reach the dashboard assistant. Please try again.",
      },
    ];
    this.cdr.markForCheck();
    this.landReply();
  }

  /** Auto-scrolls if the user was already following along; otherwise surfaces the jump link. */
  private landReply() {
    if (this.userIsNearBottom) {
      this.scrollToBottom();
    } else {
      this.newReplyAvailable = true;
    }
  }

  private startTypingAnimation() {
    this.typingAnimationSub?.unsubscribe();
    this.typingAnimationSub = interval(160).subscribe(() => {
      this.typingDotScales = this.typingDotScales.map(() => 0.45 + Math.random() * 0.65);
      this.cdr.markForCheck();
    });
  }

  private stopTypingAnimation() {
    this.typingAnimationSub?.unsubscribe();
    this.typingAnimationSub = undefined;
  }

  onConversationScroll() {
    const el = this.conversationRef?.nativeElement;
    if (!el) return;
    this.userIsNearBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 80;
    if (this.userIsNearBottom) {
      this.newReplyAvailable = false;
    }
  }

  jumpToLatest() {
    this.newReplyAvailable = false;
    this.userIsNearBottom = true;
    this.scrollToBottom();
  }

  private scrollToBottom() {
    const el = this.conversationRef?.nativeElement;
    if (!el) return;
    // Deferred so it runs after Angular's DOM update for the content that
    // triggered this scroll, not against the pre-update scrollHeight.
    setTimeout(() => {
      el.scrollTop = el.scrollHeight;
    });
  }

  switchBoard(boardId: number) {
    this.agentActionService.selectBoard(boardId);
  }

  parsedPayload(part: AgentUiPart): { title?: string; summary?: string } | undefined {
    if (typeof part.payload !== 'string') return part.payload as { title?: string; summary?: string } | undefined;
    try {
      return JSON.parse(part.payload);
    } catch {
      return undefined;
    }
  }

  private resolveParts(parts: AgentUiPart[]): Observable<ChatPart[]> {
    if (!parts.length) return of([]);
    return forkJoin(parts.map((part) => this.resolvePart(part)));
  }

  /**
   * Suggestion parts apply themselves as soon as they resolve to a real
   * gadget/target, rather than waiting for a manual confirm click — the
   * model only calls add_gadget/move_gadget when it has a grounded gadget
   * library or an explicit direction+query to act on, so the tool call
   * itself is the confirmation.
   */
  private resolvePart(part: AgentUiPart): Observable<ChatPart> {
    if (part.componentType === 'gadget-suggestion') {
      const payload = this.parsedPayload(part) as
        | { gadgetComponentType?: string; propertyValues?: Record<string, unknown> }
        | undefined;
      const gadgetComponentType = payload?.gadgetComponentType;
      if (!gadgetComponentType) return of({ ...part });

      return this.agentActionService.findGadgetDefinition(gadgetComponentType).pipe(
        map((definition) => {
          if (!definition) {
            return { ...part, gadgetPreview: definition, gadgetAdded: false };
          }
          // propertyValues comes from a second, schema-constrained model call
          // (see AgentService.enrichAddGadgetPartsWithPropertyValues) — when
          // present, it overlays real content onto the library's default
          // template instead of adding the gadget with placeholder data.
          const gadgetPreview = payload?.propertyValues
            ? this.agentActionService.applyPropertyValues(definition, payload.propertyValues)
            : definition;
          this.agentActionService.addGadgetToBoard(gadgetPreview);
          return { ...part, gadgetPreview, gadgetAdded: true };
        })
      );
    }

    if (part.componentType === 'board-list') {
      return this.agentActionService
        .getBoardSummaries()
        .pipe(map((boardSummaries) => ({ ...part, boardSummaries })));
    }

    if (part.componentType === 'gadget-move') {
      const payload = this.parsedPayload(part) as { direction?: GadgetMoveDirection; gadgetQuery?: string } | undefined;
      const direction = payload?.direction;
      const gadgetMoveQuery = payload?.gadgetQuery ?? '';
      if (!direction) return of({ ...part });

      return this.agentActionService.findGadgetOnBoard(gadgetMoveQuery).pipe(
        map((gadgetMoveTarget) => {
          if (gadgetMoveTarget) {
            this.agentActionService.moveGadget(gadgetMoveTarget.instanceId, direction);
          }
          return { ...part, gadgetMoveTarget, gadgetMoveQuery, direction, moved: !!gadgetMoveTarget };
        })
      );
    }

    if (part.componentType === 'gadget-remove') {
      const payload = this.parsedPayload(part) as { gadgetQuery?: string } | undefined;
      const gadgetRemoveQuery = payload?.gadgetQuery ?? '';

      return this.agentActionService.findGadgetOnBoard(gadgetRemoveQuery).pipe(
        map((gadgetRemoveTarget) => {
          if (gadgetRemoveTarget) {
            this.agentActionService.removeGadget(gadgetRemoveTarget.instanceId);
          }
          return { ...part, gadgetRemoveTarget, gadgetRemoveQuery, removed: !!gadgetRemoveTarget };
        })
      );
    }

    if (part.componentType === 'row-add') {
      this.agentActionService.addRow();
      return of({ ...part, rowAdded: true });
    }

    if (part.componentType === 'row-layout') {
      const payload = this.parsedPayload(part) as { rowIndex?: number; structure?: string } | undefined;
      const rowIndex = payload?.rowIndex;
      const structure = payload?.structure as LayoutType | undefined;
      if (rowIndex === undefined || !structure) return of({ ...part });

      return this.agentActionService.changeRowLayout(rowIndex, structure).pipe(
        map((rowLayoutApplied) => ({ ...part, rowIndex, rowStructure: structure, rowLayoutApplied }))
      );
    }

    return of({ ...part });
  }
}
