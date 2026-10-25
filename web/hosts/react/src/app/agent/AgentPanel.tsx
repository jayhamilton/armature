import Button from '@mui/material/Button';
import IconButton from '@mui/material/IconButton';
import TextField from '@mui/material/TextField';
import { useCallback, useEffect, useRef, useState, type KeyboardEvent } from 'react';
import { firstValueFrom } from 'rxjs';
import {
  applyA2uiAction,
  buildAgentRequest,
  resolveUiPart,
  streamChat,
  UI_PART_EVENT,
  type AgentUiPart,
  type AgUiEvent,
} from '@armature/core';
import { environment } from 'src/environments/environment';
import { boardService } from '../board/board.service';
import { eventService } from '../eventservice/event.service';
import { libraryService } from '../library/library.service';
import { useEventEffect } from '../../lib/useEventEffect';
import { MatIcon } from '../shared/mat-icon/MatIcon';
import type { ChatPart } from './partCardRegistry';
import { PartView } from './PartView';
import { reactAgentActions } from './reactAgentActions';
import { useSpeech } from './useSpeech';
import './AgentPanel.css';

interface ChatMessage {
  id: number;
  role: 'user' | 'assistant';
  content?: string;
  parts?: ChatPart[];
}

const ERROR_REPLY = "Sorry, I couldn't reach the dashboard assistant. Please try again.";

/** The Authorization header armature-ui's TokenInterceptor adds: the raw session token, when signed in. */
function authHeaders(): Record<string, string> {
  const token = sessionStorage.getItem(environment.sessionToken);
  return token ? { Authorization: token } : {};
}

/**
 * The assistant panel, ported from armature-ui's AgentPanelComponent. The
 * streaming client, request builder, and part resolvers come from
 * @armature/core, shared with the Angular host; this component holds the
 * conversation state and renders it.
 */
export function AgentPanel() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [prompt, setPrompt] = useState('');
  const [sending, setSending] = useState(false);
  // True from RUN_STARTED until TEXT_MESSAGE_START: a thinking model can
  // reason for many seconds before any text, and this tells the user that
  // is expected progress rather than a stall.
  const [thinking, setThinking] = useState(false);
  const [newReplyAvailable, setNewReplyAvailable] = useState(false);
  const [typingDotScales, setTypingDotScales] = useState([0.5, 0.5, 0.5, 0.5]);

  const conversationRef = useRef<HTMLDivElement>(null);
  // Whether the user is following along at the bottom: a reply then lands
  // with an auto scroll; otherwise a "New reply" button appears instead of
  // pulling their view away from what they are reading.
  const nearBottomRef = useRef(true);
  // The assistant message the current run is filling in.
  const currentRef = useRef<{ id: number; content: string } | undefined>(undefined);
  const abortRef = useRef<AbortController | undefined>(undefined);

  const speech = useSpeech(setPrompt);

  // The panel is hidden, not unmounted, when it closes, so a listening
  // microphone or a reply being read would keep going: stop both.
  useEventEffect(eventService.listenForCloseAgentPanelEvent(), () => speech.stopAll());

  useEffect(() => () => abortRef.current?.abort(), []);

  // Scale and opacity jump to random values on an interval, rather than a
  // repeating keyframe loop, so the motion never visibly cycles.
  useEffect(() => {
    if (!sending) return;
    const timer = setInterval(() => setTypingDotScales((dots) => dots.map(() => 0.45 + Math.random() * 0.65)), 160);
    return () => clearInterval(timer);
  }, [sending]);

  const scrollToBottom = useCallback(() => {
    // Deferred so it runs after React renders the content that caused it.
    setTimeout(() => {
      const el = conversationRef.current;
      if (el) el.scrollTop = el.scrollHeight;
    });
  }, []);

  const follow = useCallback(() => {
    if (nearBottomRef.current) scrollToBottom();
  }, [scrollToBottom]);

  const landReply = useCallback(() => {
    if (nearBottomRef.current) scrollToBottom();
    else setNewReplyAvailable(true);
  }, [scrollToBottom]);

  const updateMessage = useCallback((id: number, change: (message: ChatMessage) => ChatMessage) => {
    setMessages((current) => current.map((message) => (message.id === id ? change(message) : message)));
  }, []);

  const showError = useCallback(() => {
    currentRef.current = undefined;
    setSending(false);
    setThinking(false);
    setMessages((current) => [...current, { id: Date.now() + 1, role: 'assistant', content: ERROR_REPLY }]);
    landReply();
  }, [landReply]);

  const handleEvent = useCallback(
    (event: AgUiEvent) => {
      switch (event.type) {
        case 'RUN_STARTED':
          setThinking(true);
          break;
        case 'TEXT_MESSAGE_START': {
          const id = Date.now() + 1;
          currentRef.current = { id, content: '' };
          setMessages((current) => [...current, { id, role: 'assistant', content: '', parts: [] }]);
          setSending(false);
          setThinking(false);
          break;
        }
        case 'TEXT_MESSAGE_CONTENT': {
          const current = currentRef.current;
          if (!current) break;
          current.content += event.delta;
          const content = current.content;
          updateMessage(current.id, (message) => ({ ...message, content }));
          follow();
          break;
        }
        case 'CUSTOM': {
          const current = currentRef.current;
          if (event.name !== UI_PART_EVENT || !current) break;
          void resolveUiPart(event.value as AgentUiPart, reactAgentActions).then((resolved) => {
            updateMessage(current.id, (message) => ({ ...message, parts: [...(message.parts ?? []), resolved] }));
            follow();
          });
          break;
        }
        case 'RUN_FINISHED': {
          const current = currentRef.current;
          currentRef.current = undefined;
          setSending(false);
          setThinking(false);
          if (current) speech.speak(current.content);
          landReply();
          break;
        }
        case 'RUN_ERROR':
          showError();
          break;
        // TEXT_MESSAGE_END and the TOOL_CALL events have no UI yet.
      }
    },
    [follow, landReply, showError, speech, updateMessage]
  );

  async function send() {
    const text = prompt.trim();
    if (!text || sending) return;

    setMessages((current) => [...current, { id: Date.now(), role: 'user', content: text }]);
    setPrompt('');
    setSending(true);
    setThinking(false);
    nearBottomRef.current = true;
    scrollToBottom();

    const abort = new AbortController();
    abortRef.current = abort;
    try {
      const [board, library] = await Promise.all([
        firstValueFrom(boardService.getLastSelectedBoard()),
        firstValueFrom(libraryService.getLibrary()),
      ]);
      const request = buildAgentRequest(text, board, library);
      for await (const event of streamChat(request, {
        baseUrl: environment.apihost,
        headers: authHeaders,
        signal: abort.signal,
      })) {
        handleEvent(event);
      }
    } catch {
      if (!abort.signal.aborted) showError();
    }
  }

  function onComposerKeyDown(event: KeyboardEvent) {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      void send();
    }
  }

  function onConversationScroll() {
    const el = conversationRef.current;
    if (!el) return;
    nearBottomRef.current = el.scrollHeight - el.scrollTop - el.clientHeight < 80;
    if (nearBottomRef.current) setNewReplyAvailable(false);
  }

  function jumpToLatest() {
    setNewReplyAvailable(false);
    nearBottomRef.current = true;
    scrollToBottom();
  }

  /** Confirm or cancel on an a2ui card; the rule (only confirm adds the gadget) is in @armature/core. */
  function onA2uiAction(part: ChatPart, action: string) {
    const a2uiResolution = applyA2uiAction(part, action, reactAgentActions);
    if (!a2uiResolution) return;
    setMessages((current) =>
      current.map((message) => ({
        ...message,
        parts: message.parts?.map((p) => (p === part ? { ...p, a2uiResolution } : p)),
      }))
    );
  }

  return (
    <div className="agent-panel">
      <div className="agent-panel-header">
        <div className="agent-panel-header-text">
          <span className="agent-panel-title">Assistant</span>
          <span className="agent-panel-subtitle">Conversational dashboard helper</span>
        </div>
        <div className="agent-panel-header-actions">
          {speech.voiceOutputSupported && (
            <IconButton
              className={['agent-panel-header-btn', speech.readAloud ? 'agent-panel-voice-toggle-active' : '']
                .filter(Boolean)
                .join(' ')}
              onClick={speech.toggleReadAloud}
              aria-pressed={speech.readAloud}
              aria-label={speech.readAloud ? 'Turn off reading replies aloud' : 'Read replies aloud'}
              size="small"
            >
              <MatIcon>{speech.readAloud ? 'volume_up' : 'volume_off'}</MatIcon>
            </IconButton>
          )}
          <IconButton
            className="agent-panel-header-btn"
            onClick={() => eventService.emitCloseAgentPanelEvent()}
            size="small"
            aria-label="Close assistant panel"
          >
            <MatIcon>close</MatIcon>
          </IconButton>
        </div>
      </div>

      <div className="agent-panel-body">
        <div className="agent-panel-conversation" ref={conversationRef} onScroll={onConversationScroll}>
          {messages.length === 0 && (
            <div className="agent-panel-empty-state">
              <p>Ask the dashboard to create boards, add widgets, or explain the current view.</p>
            </div>
          )}

          {messages.map((message) => (
            <div
              key={message.id}
              className={['agent-panel-message', message.role === 'assistant' ? 'agent-panel-message-assistant' : '']
                .filter(Boolean)
                .join(' ')}
            >
              <div className="agent-panel-message-role">{message.role === 'assistant' ? 'Assistant' : 'You'}</div>
              <div className="agent-panel-message-content">
                {message.content && <p>{message.content}</p>}
                {message.parts?.map((part) => (
                  <PartView
                    key={part.id}
                    part={part}
                    onSwitchBoard={(boardId) => reactAgentActions.selectBoard(boardId)}
                    onA2uiAction={onA2uiAction}
                  />
                ))}
              </div>
            </div>
          ))}

          {sending && (
            <div className="agent-panel-message agent-panel-message-assistant">
              <div className="agent-panel-message-role">Assistant</div>
              <div
                className="agent-panel-typing"
                role="status"
                aria-label={thinking ? 'Assistant is thinking' : 'Assistant is working'}
              >
                {thinking && <span className="agent-panel-thinking-label">Thinking…</span>}
                {typingDotScales.map((scale, index) => (
                  <span
                    key={index}
                    className="agent-panel-typing-dot"
                    style={{ transform: `scale(${scale})`, opacity: scale }}
                  />
                ))}
              </div>
            </div>
          )}
        </div>

        {newReplyAvailable && (
          <Button className="agent-panel-jump-latest" variant="outlined" onClick={jumpToLatest}>
            <MatIcon>arrow_downward</MatIcon> New reply
          </Button>
        )}

        <div className="agent-panel-composer">
          <TextField
            className="agent-panel-input"
            label="Ask the dashboard"
            multiline
            rows={5}
            value={prompt}
            disabled={sending}
            onChange={(event) => setPrompt(event.target.value)}
            onKeyDown={onComposerKeyDown}
          />

          <div className="agent-panel-composer-actions">
            {speech.voiceInputSupported && (
              <IconButton
                className={['agent-panel-mic', speech.listening ? 'agent-panel-mic-active' : ''].filter(Boolean).join(' ')}
                disabled={sending}
                onClick={speech.toggleListening}
                aria-pressed={speech.listening}
                aria-label={speech.listening ? 'Stop voice input' : 'Start voice input'}
              >
                <MatIcon>{speech.listening ? 'mic' : 'mic_none'}</MatIcon>
              </IconButton>
            )}
            <IconButton className="agent-panel-send" disabled={sending} onClick={() => void send()} aria-label="Send message">
              <MatIcon style={{ fontSize: 20 }}>send</MatIcon>
            </IconButton>
          </div>
        </div>
      </div>
    </div>
  );
}
