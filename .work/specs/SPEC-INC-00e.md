# SPEC-INC-00e: React host parity, part 2 (the assistant)

## Goal

Give the React host the assistant the Angular host has today, with the framework free half of it
built once in `@armature/core` so both hosts (and later Lit, Svelte, and vanilla) share one
implementation. After this increment a user can open the assistant in either host, ask in text or
by voice, watch the reply stream in, and see the same board changes and inline cards (board list,
add, move, remove gadget, add row, row layout, MCP Apps) happen in both.

## Vision outcome served

**Consolidation** and **Deliver anywhere**. The assistant is how one question reaches many
capabilities, and putting the AG-UI client and MCP Apps host bridge in core is the plan's own
layering ("AG-UI stream client, MCP Apps host bridge wrapper" are listed as core contents), started
now instead of at INC-03.

## Entry criteria

- INC-00d merged; its report written.

## What exists today (Angular, about 1,340 lines)

| File | Role |
| --- | --- |
| `agent/agent.service.ts` | Builds the request (message, board context, gadget library, board gadgets), POSTs `/api/agent/chat`, parses the SSE frames into AG-UI events |
| `agent/agent-action.service.ts` | Turns tool intents into board mutations through `EventService` and `BoardService` |
| `agent/agent-panel.component.ts` | Conversation, streaming text, thinking and typing indicator, "New reply" jump link, voice input (Web Speech), read aloud (speech synthesis), and an `if` chain resolving each `ui-part` by `componentType` |
| `agent/mcp-app.service.ts`, `mcp-app-viewer.component.ts` | MCP client over SSE, discovers a tool's `ui://` resource, renders it in a sandboxed iframe through the official `AppBridge` |
| `agent/a2ui/*` | A2UI renderer (Card, Text, Button) for a confirm or cancel card; dormant (nothing produces `a2ui-card` today) but kept |

React has only the panel shell (`AgentPanel.tsx`, placeholder body).

## Scope

### 1. `@armature/core`: agent and MCP Apps (framework free)

- `agent/ag-ui.ts`: the AG-UI event union, identical to today's (matches the backend records in
  `agent.agui`), plus `AgentRequest` and `AgentUiPart` types.
- `agent/sse-frame-parser.ts`: an incremental parser that accepts chunks and yields complete
  `data:` frames, keeping a partial frame for the next chunk and skipping a malformed frame instead
  of ending the stream (today's behavior, extracted and tested on its own).
- `agent/agent-client.ts`: `streamChat(request, options)` returns an `AsyncIterable<AgUiEvent>`
  using `fetch` and the response body stream. `options` supplies `baseUrl`, a `headers()`
  function (hosts pass their auth), and an `AbortSignal`. Sends `Accept: text/event-stream`.
- `agent/build-agent-request.ts`: pure function from (message, selected board, library) to
  `AgentRequest`, including the `boardGadgets` grounding list.
- `agent/ui-part-resolvers.ts`: **one resolver per `componentType`, registered in the existing
  `TypeRegistry`**, replacing the Angular `if` chain (`gadget-suggestion`, `a2ui-card`,
  `board-list`, `gadget-move`, `gadget-remove`, `row-add`, `row-layout`). Each resolver receives
  the part and an `AgentActions` port and returns the resolved part. A new part type is a new
  resolver, not an edit (Open/Closed). Marked with `@pattern Strategy`, `@role ConcreteStrategy`,
  `@principle OpenClosed`, so it appears in the generated catalog.
- `agent/agent-actions.ts`: the `AgentActions` port the host implements (find gadget definition,
  add gadget, list boards, select board, find gadget on board, move, remove, add row, change row
  layout), plus the pure helpers `applyPropertyValues` and `findGadgetByTitle`. Two
  implementations exist in this increment (React and Angular), which meets the plan's rule for a
  port.
- `mcp-apps/load-mcp-app.ts`: given a connected MCP `Client` and a tool name, discover
  `_meta.ui.resourceUri`, read the HTML, call the tool (today's three step flow).
- `mcp-apps/mount-mcp-app.ts`: wraps `AppBridge` and `PostMessageTransport` for a given iframe:
  handshake, send tool input and result, resize on `sizechange`, report errors, dispose. Same
  single iframe `sandbox="allow-scripts"` with `srcdoc` choice as Angular, with the same comment
  that it must be revisited before third party servers (INC-07).
- `a2ui/a2ui.ts`: the `A2uiNode` type.
- Dependencies added to core: `@modelcontextprotocol/sdk` and `@modelcontextprotocol/ext-apps`
  (both "Keep" in the dependency policy; already used by the Angular host).
- Tests (`node:test`): frame parser (frames split across chunks, several frames in one chunk,
  malformed frame skipped, trailing partial frame held), request builder, every resolver against a
  fake `AgentActions` (found, not found, invalid row index), `applyPropertyValues`,
  `streamChat` against a stubbed `fetch`, `loadMcpApp` against a fake client (tool without
  `ui.resourceUri` gives a clear error).

### 2. React host: the assistant

- `agent/reactAgentActions.ts`: `AgentActions` implemented with the existing `eventService`,
  `boardService`, and `libraryService`.
- `agent/AgentPanel.tsx`: the full panel, behavior matching Angular: empty state text, user and
  assistant messages, streamed text, thinking label and typing dots, tool call list, auto scroll
  when following and a "New reply" button when scrolled up, Enter to send, error message on
  `RUN_ERROR` or network failure, cancel the stream when the panel closes.
- Part components: `BoardListCard`, `GadgetActionCard` (suggestion, move, remove), `RowActionCard`
  (add, layout), `IframeCard`, `McpAppViewer` (uses core's `loadMcpApp` and `mountMcpApp`),
  `A2uiRenderer`.
- `agent/useSpeech.ts`: voice input and read aloud, shown only when the browser supports them;
  both stop when the panel closes.
- `mcp-apps/mcpClient.ts`: one shared MCP client per app over the SSE transport, as Angular does.
- Uses `apiFetch` headers from INC-00d for auth.

### 3. Angular host: move onto the shared core

- `AgentService` delegates to core's `buildAgentRequest` and `streamChat` (wrapped as an
  `Observable`); `AgentActionService` implements `AgentActions`; the panel's `resolvePart` `if`
  chain is replaced by the core resolver registry; `McpAppViewerComponent` uses core's loader and
  mount. Templates and styles are unchanged, so users see no difference.
- Because core's client uses `fetch`, the Angular `TokenInterceptor` no longer covers this call;
  the Angular wrapper passes the same headers explicitly through `options.headers()`, with a
  comment saying why.
- Existing Angular tests stay green.

### 4. Conformance scenarios (added to the INC-00d suite)

SSE responses are stubbed with `page.route` using recorded AG-UI frames (stored under
`web/conformance/fixtures/agui/`), so no backend or model is needed. Each scenario passes against
both hosts:

1. Ask a question; streamed text appears in order and the typing indicator clears.
2. A `gadget-suggestion` part adds the gadget to the board with the model's property values.
3. A `board-list` part lists boards; "Switch" selects one.
4. `gadget-move` and `gadget-remove` act on the matched gadget; an unmatched query shows the "Couldn't
   find" message and changes nothing.
5. `row-add` and `row-layout`; an out of range row index shows the message and changes nothing.
6. `RUN_ERROR` shows the error reply and the composer is usable again.

MCP Apps and voice are verified manually against the real backend (MCP's SSE transport and the
Web Speech API are impractical to stub well); recorded in the report with screenshots.

### 5. Documentation

- `web/packages/core/README.md`: the agent and MCP Apps modules, with the frame parser and resolver
  registry explained as teaching material.
- `docs/patterns/strategy-registry.md`: add the UI part resolvers as the second worked example.
- PlantUML sequence `docs/architecture/sequences/assistant-chat.puml` (and `.svg`): host panel,
  core client, `/api/agent/chat`, resolver, `AgentActions`, board.
- C4 `web-layers-target` note updated: core now holds the AG-UI client and MCP Apps bridge.
- `PORTING_STATUS.md`: the agent moves to "Fully ported"; remaining gaps listed with owners.
- `docs/increments/INC-00e.md` via the `armature-document-increment` skill, including
  "Patterns introduced".

## Out of scope (and why)

| Item | Why not now |
| --- | --- |
| XState assistant run machine | INC-03, together with `compose_board` and preview and undo; the panel keeps today's plain state so INC-03 replaces one thing |
| Tool calls acting on server state | INC-03 (boards are still browser only until INC-01) |
| `<armature-assistant>` custom element | INC-04 introduces `@armature/elements`; this increment keeps the panel host native but puts all non visual logic in core so that move is mostly markup |
| Third party MCP Apps, double iframe sandbox | INC-07 |
| Moving the backend MCP transport from SSE to Streamable HTTP | Backend change; not needed for parity |

## Files touched

- Core new: `src/agent/*`, `src/mcp-apps/*`, `src/a2ui/*`, tests; `package.json` (two
  dependencies), `index.ts` exports.
- React new: `src/app/agent/*` (panel, cards, `useSpeech`, `reactAgentActions`),
  `src/app/mcp-apps/mcpClient.ts`; edited `package.json` (`@armature/core` via
  `file:../../packages/core`, MCP SDKs).
- Angular edited: `agent/agent.service.ts`, `agent-action.service.ts`,
  `agent-panel.component.ts` (resolution only), `mcp-app.service.ts`,
  `mcp-app-viewer.component.ts`, `package.json` (`@armature/core`).
- Conformance: new scenarios and AG-UI fixtures.
- CI: host workflows build core first.
- Docs: as in section 5.

## Tests and checks

| Check | Command | Expected |
| --- | --- | --- |
| Core | `cd web/packages/core && npm ci && npm run build && npm test && npm run catalog:check` | Pass, including the new agent and MCP Apps tests; catalog lists the resolvers |
| React | `npm ci && npm run build && npm run lint` | Pass |
| Angular | build and Karma | Pass, same count plus any new specs |
| Conformance | both hosts | 11 of 11 (5 from 00d, 6 new) |
| Manual, real backend with Ollama | Both hosts: "add a bar chart of sales", "show my boards", "move the chart right", "show me a board summary" (MCP App), voice input, read aloud | Same results in both hosts; screenshots in the report |
| Backend, diagrams | as before | Pass |

## Size

Estimated 1,600 to 1,900 changed lines excluding lock files and fixtures, above the 1,500
guideline. If you want it smaller, section 3 (moving Angular onto core) can become its own small
increment; the cost is that until then the two hosts run two implementations of the same logic,
which is the drift this work exists to stop.

## Decisions to confirm before building

1. **Shared core for agent logic**, with React and Angular both using it in this increment
   (section 3), rather than React only.
2. **Resolver registry** replaces the `componentType` `if` chain, in both hosts.
3. **`fetch` in core** rather than a host supplied HTTP function, with hosts passing auth headers.
4. **Port the dormant A2UI card** for parity even though nothing produces it today.
5. **MCP Apps and voice verified manually**, not in the conformance suite.

## Amendments (approved 2026-10-02, after checking this spec against `main` with 00c and 00d merged)

The five decisions above are confirmed. These amendments apply on top of them.

1. **No type switch on the render side in React.** Part components are chosen through a
   `TypeRegistry` of components keyed by `componentType` in the React host, not a `switch`.
2. **The Angular template keeps its `@if` chain on `componentType`.** Templates stay unchanged in
   this increment, so the branch is recorded under "Not done and why" and owned by INC-04, where
   cards become custom elements.
3. **Auth headers match `TokenInterceptor` exactly.** `Authorization` is the raw session token.
   Core sets `Content-Type: application/json` and `Accept: text/event-stream`. Both hosts supply
   `Authorization` through `options.headers()`. React reads `sessionStorage` as `apiFetch` does,
   but does not call `apiFetch`, which parses JSON.
4. **Dependency verdict:** the plan lists `@modelcontextprotocol/ext-apps` as Keep, while the
   dependency audit says Watch, with 2.x to be evaluated in INC-07. The plan wins. Core and React
   use the ranges Angular already uses (`sdk` ^1.30.0, `ext-apps` ^1.7.5), and the audit row notes
   the new users.
5. **CI:** `react.yml`, `angular.yml`, and `web-conformance.yml` add `web/packages/core/**` to their
   path filters and build core before installing the host. Hosts depend on
   `"@armature/core": "file:../../packages/core"`.
