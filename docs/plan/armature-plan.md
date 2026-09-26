# Armature: Modular Architecture and Incremental Build Plan

Plan as of Sep 26, 2026. Maintainer: Steve Hamilton.

## Vision

Armature becomes the place where a customer's answers are assembled, kept, and delivered anywhere, and every capability in it arrives as a declared, discoverable extension rather than hand wired code.

This plan serves four outcomes from the project brief:

1. **No assumptions.** The user, or an agent acting for the user, decides what a board shows. The framework only knows gadgets, boards, and capabilities as data.
2. **Consolidation without a new monolith.** Each service contributes gadgets, data sources, tools, and commands through a manifest, the way a VS Code extension contributes to the editor. Adding a service is a manifest, not a portal.
3. **Return to information.** Answers can be pinned, and a pinned answer is a live gadget bound to its query, not a screenshot.
4. **Deliver anywhere.** The same board and gadget resources are reachable by the Armature UI, by any MCP client, by peer agents over A2A, and by channels such as Teams and email.

The design stance that ties these together comes from the author's article *HATEOAS as the Cure for MCP Tool Bloat*: *the API should tell the client what is possible right now*. Board and capability resources carry state gated links (HATEOAS), their lifecycles are explicit state machines, and every client, human or agent, follows those links instead of hard coding what is allowed.

## Architectural principles

Six principles govern every increment; a change that breaks one needs an ADR explaining why.

### 1. REST by TMF 630

Board, gadget, capability, and data source resources follow the [TMF 630 REST API Design Guidelines](https://www.tmforum.org/resources/specifications/tmf630-rest-api-design-guidelines-5-0-0/). Concretely:

| Concern | Armature rule |
| --- | --- |
| Identity | Every resource carries `id` and `href` |
| Polymorphism | `@type`, `@baseType`, `@schemaLocation` on gadgets and capabilities, so a new gadget type extends a base schema instead of changing the API |
| Selection | `fields=` for attribute selection, always returning `id` and `href` |
| Filtering and sorting | `attr=value` and operator forms, `sort=-lastUpdate` |
| Pagination | `offset`, `limit`, `X-Total-Count`, `X-Result-Count`, `206 Partial Content` |
| Partial update | `PATCH` with `application/merge-patch+json` and `application/json-patch+json` |
| Errors | **Deliberate deviation:** RFC 9457 problem details (`application/problem+json`) instead of the TMF error object; see the error and help strategy (ADR required) |
| Long operations | Task resources (for example `POST /boardComposition`) with their own lifecycle, rather than blocking calls |
| Events | A `/hub` subscription resource and event types such as `BoardStateChangeEvent`, so Teams, email, and A2A peers are notified rather than polling |

The [opentmf tmf630-toolkit](https://github.com/opentmf/tmf630-toolkit) implements these query rules for Spring Web MVC, but it is a very small community project, so under the dependency policy Armature implements TMF 630 querying itself in a `tmf` module and uses the toolkit only as a reference. That also makes the query parser a readable teaching example (Interpreter and Specification patterns).

### 2. HATEOAS as the engine of state, for people and agents

This carries the *HATEOAS as the Cure for MCP Tool Bloat* argument into Armature. Responses are **plain HAL** (`application/hal+json`, decided) with state gated links, built with Spring HATEOAS assemblers. Because plain HAL links carry only `href`, `templated`, `title`, `name`, and `type`, the method and request body for each relation are defined once, per relation, in a link relation catalog, and HAL CURIEs point every `arm:` relation at its catalog page, so a client (person or agent) can always look up what following a link means:

- A `DRAFT` board offers `publish` and `discard`; a `PUBLISHED` board offers `lock`, `share`, `subscribe`; a `LOCKED` board offers no edit links at all.
- The UI renders affordances from links (the lock toggle and gadget remove icons appear only when the link is present), which removes duplicated business rules from every UI host.
- The MCP surface shrinks to a few bounded context entry points (`navigate_boards`, `navigate_capabilities`) plus a small number of typed write shortcuts (`compose_board`), exactly the hybrid that article describes.

TMF 630 already requires `href`; HATEOAS is the Armature extension on top of it, not a conflict with it.

### 3. Open/Closed through Strategy and State

New behavior arrives as a new class or a new manifest entry, never as an edited `switch`. The extension seams:

| Seam | Pattern | Examples of strategies |
| --- | --- | --- |
| Data source | Strategy | `StaticJsonSource`, `RestSource` (SPEC-73), `McpToolSource`, `A2aAgentSource` |
| Gadget rendering per channel | Strategy | Custom element (any host), MCP App, Adaptive Card, static HTML for email |
| Model provider | Strategy (with Chain of Responsibility for fallback) | Ollama, Anthropic, OpenAI compatible gateway |
| Capability transport | Strategy | Manifest over HTTP, MCP server, A2A agent card |
| Resource lifecycle | State | Board, capability, pinned answer, composition task |

Strategies are discovered through a registry keyed by `@type`, the same way `gadget-registry.ts` already keys gadgets by `componentType`.

### 4. Explicit state machines, on both sides

Lifecycles are declared, not implied by boolean flags.

- **Backend (decided):** the State pattern, hand written, behind a `LifecycleEngine` port. Each state is a class in a sealed hierarchy that knows its allowed events and target states. Spring Statemachine was ruled out because it is in maintenance mode with [no plan to support Spring Boot 4](https://github.com/spring-projects/spring-statemachine/issues/1207). The implementation doubles as the project's reference example of the State pattern.
- **Frontend:** XState v5 for UI flows that are genuinely stateful: the assistant run (idle, streaming, tool call, awaiting confirmation, error), board editing (viewing, editing, configuring gadget, locked), and capability activation.
- **One definition:** the server lifecycle is authoritative. Its states and events are published as a JSON machine definition; the XState machine and the HATEOAS link rules are tested against it, so the three never drift.

### 5. Declared extension, VS Code style

Capabilities are manifests with `contributes`, activation events, and `when` clauses, modeled on the [VS Code extension manifest](https://code.visualstudio.com/api/references/extension-manifest). Detailed in the extension model section.

### 6. Local first, with background sync to the backend

The UI works on a local copy and never waits on the network; the backend is the shared, durable copy it syncs with. This keeps what Armature has always done well (a board works with no backend at all) while adding persistence, sharing, and agent access.

- **Local store:** boards live in IndexedDB through `@armature/core`, replacing today's `localStorage` (a one time migration moves existing boards). Every host gets the same behavior because the store and sync engine are framework free.
- **Change log:** each local edit is recorded as a JSON Patch operation in a client side outbox, applied locally at once, then sent in the background.
- **Sync protocol:** `PATCH` with `application/json-patch+json` and `If-Match` on the board's `ETag` (its `version`). Changes made elsewhere (another device, the assistant, an MCP client, an A2A peer) come back through a server sent event feed of board events, and the client pulls the new representation.
- **Conflicts are problems, not silent overwrites:** a stale version returns `412` as the RFC 9457 problem `board-version-conflict`, whose links offer *reload*, *reapply my changes*, or *keep mine as a copy*. JSON Patch on separate paths usually reapplies cleanly.
- **Offline is a state:** an XState *sync* machine (`idle`, `syncing`, `offline`, `conflict`, `error`) drives a visible status indicator. Offline, the UI offers only links from the last known representation; lifecycle transitions are queued and confirmed by the server, which stays authoritative for them.
- **Standalone mode stays:** with no backend configured, the sync engine is simply off and Armature runs entirely locally, as today.
- **Not now:** CRDTs (Yjs, Automerge) for real time co editing. Revisit only if simultaneous editing of one board becomes a requirement.

## Baseline: what exists today

The runtime and the agent protocols are real; persistence, data, extension, and lifecycle are not yet. Reviewed on 2026-09-26.

| Area | Built | Missing against this plan |
| --- | --- | --- |
| Gadget model | `library.json` property pages drive the config form, the LLM's structured output, and MCP; 11 gadgets; lazy `gadget-registry.ts` | No `@type`/`@baseType`; gadgets compiled into the bundle |
| Boards | Multi board, per row layouts, masonry, lock, themes | Stored in browser `localStorage`; server only sees a snapshot after a chat (`BoardSnapshotStore`) |
| REST API | `/api/agent/chat`, `EndpointController` (SPEC-73 start), OpenAPI via springdoc | No board resources; no TMF 630 conventions; no links |
| Agent | Ollama `qwen3.5:4b` with tools, schema constrained output, Anthropic toggle, one tool call per turn | Tools return intents instead of applying changes; no fallback chain |
| Protocols | MCP server (7 tools), MCP Apps producer (`present_board_summary`, uncommitted `present_chart`) and host (AppBridge), AG-UI over SSE, A2UI renderer | MCP client (Phase 4); A2A inactive; no auth on `/sse` |
| State | Boolean flags and `EventService` events | No state machines on either side |
| Extension | None | Manifests, activation, `when` clauses |
| Docs | Detailed READMEs, MODEL\_INTEGRATION.md, `.work` SPEC and IMPL files | No C4, sequence, or state diagrams; no ADRs |
| Tests | 24 UI specs, 5 backend test classes | No contract tests on API or lifecycles |
| UI frameworks | Angular 22 (reference), React port (2 commits) | One shared contract both can follow |

## Target architecture

One domain layer, four facades, and a capability registry that every service plugs into. This is the container view; the repo versions live as SVG under `docs/architecture/c4/`.

> Diagram (C4 container view · 4 facades over one domain layer) is maintained in the planning doc; it is recreated here as C4-PlantUML in INC-00b.

The customer, an AI client, a peer agent, and Teams all reach the same boards through different doors; capability services plug in behind the registry, so adding one never touches a facade.

### C4 views to maintain

| Level | View | Answers |
| --- | --- | --- |
| 1 Context | Armature, customer, AI clients, peer agents, channels, capability services | Who uses Armature and what it depends on |
| 2 Container | The view above | Which deployable pieces exist and how they talk |
| 3 Component | armature-ms: facades, `BoardService`, `LifecycleEngine`, `CapabilityRegistry`, `DataSourceStrategy`, `ChannelRenderer`, `AgentRuntime` | Where each extension seam lives |
| 3 Component | armature-ui: board shell, gadget host, contribution renderer, assistant panel, XState actors | How contributions become UI |
| Dynamic | Capability activation; ask, answer, pin, return; A2A task | Covered by PlantUML sequences instead |

### Key components

- **`BoardService`** owns board, row, and gadget instance resources; all writes go through a lifecycle transition.
- **`LifecycleEngine`** (port) implemented with the State pattern; decides allowed transitions and therefore which links appear, which problems are raised, and which events are published.
- **`CapabilityRegistry`** loads manifests, evaluates activation events and `when` clauses, and exposes merged contributions to every facade.
- **`DataSourceStrategy`** and **`ChannelRenderer`** registries keyed by `@type`.
- **`AgentRuntime`** wraps `ChatClient` and the model provider chain; it sees tools from Armature and from active capabilities.

### Persistence (decided, ADR-0003)

PostgreSQL, accessed with Spring Data JDBC behind the `BoardRepository` port.

- **Relational columns** for what is queried and governed: `id`, owner, sharing, lifecycle `state`, `@type`, timestamps, `version`.
- **JSONB** for what gadgets define: property values and data configuration, which vary by gadget `@type` and capability.
- **Aggregates, not entity graphs:** a `Board` saves and loads with its rows and gadget instances as one unit; no lazy loading or session state, which keeps the code readable as teaching material. A small JSONB converter is the Adapter example here.
- **Why it fits the plan:** Spring Modulith's event publication registry shares the board's transaction (a true outbox); TMF 630 filters map to SQL and JSONB path queries with GIN indexes; `version` drives optimistic locking exposed as `ETag` and `If-Match`; pgvector can later hold help catalog embeddings for `search_help`.
- **Zero setup kept:** an in memory `BoardRepository` adapter is the demo default; PostgreSQL runs by profile, with Testcontainers in tests and Docker Compose locally. Both adapters pass the same contract suite.
- **Schema changes** go through Flyway migrations, reviewed like code.

## Extension model: capability manifests

A capability is a service described by a manifest; Armature reads the manifest and the UI, the agent, and the APIs grow accordingly, with no Armature release. The shape borrows directly from the [VS Code extension manifest](https://code.visualstudio.com/api/references/extension-manifest): identity, `engines`, `activationEvents`, `contributes`, and dependencies.

### Mapping from VS Code

| VS Code | Armature capability | Purpose |
| --- | --- | --- |
| `name`, `publisher`, `version` | `id`, `publisher`, `version` | Identity and semver |
| `engines.vscode` | `engines.armature` | Contract version compatibility; incompatible manifests are rejected, not half loaded |
| `activationEvents` | `activationEvents` | `onCustomerService:fiber`, `onBoardOpen`, `onAsk:billing`, `onStartup` |
| `contributes.commands` | `contributes.commands` | Actions such as `fiber.openTicket` |
| `contributes.menus` with `when` | `contributes.menus` with `when` | Place commands in the toolbar, gadget header, or assistant suggestions only when relevant |
| `contributes.views` | `contributes.gadgets` | New gadget types as `library.json` entries, or MCP App `ui://` resources |
| `contributes.configuration` | `contributes.configuration` | Settings rendered by the existing dynamic form |
| (none) | `contributes.dataSources` | Strategies such as REST, MCP tool, A2A skill |
| (none) | `contributes.tools` | Agent tools, namespaced and filtered |
| (none) | `contributes.help` | Markdown help, surfaced in the help panel and to the agent |
| `extensionDependencies` | `capabilityDependencies` | Load order and failure isolation |
| `capabilities.untrustedWorkspaces` | `trust` | Sandbox level for embedded MCP Apps |

### Example manifest

```json
{
  "@type": "CapabilityManifest",
  "id": "fiber-insights",
  "publisher": "fiber-services",
  "version": "1.2.0",
  "engines": { "armature": "^1.0.0" },
  "activationEvents": ["onCustomerService:fiber", "onAsk:network"],
  "contributes": {
    "gadgets": [{ "@type": "ConnectionHealthGadget", "@baseType": "TableGadget", "semanticType": "schema:Observation", "@schemaLocation": "https://.../connection-health.schema.json" }],
    "dataSources": [{ "id": "fiber.connections", "@type": "McpToolSource", "server": "fiber-mcp", "tool": "list_connections" }],
    "commands": [{ "command": "fiber.openTicket", "title": "Open a repair ticket for this connection" }],
    "menus": { "gadget/header": [{ "command": "fiber.openTicket", "when": "gadget.type == ConnectionHealthGadget && connection.status == DEGRADED" }] },
    "tools": [{ "server": "fiber-mcp", "include": ["list_connections", "connection_status"] }],
    "help": "help/connection-health.md"
  }
}
```

### Capability lifecycle

`DISCOVERED` then `VALIDATED` (schema and `engines` check) then `INACTIVE`; an activation event moves it to `ACTIVATING` and `ACTIVE`; failures go to `FAILED` with a retry link; an administrator can move it to `DISABLED`. Each state exposes only its valid links (`activate`, `disable`, `retry`), which is both the HATEOAS contract and the XState chart in the UI.

### Where `when` clauses and links meet

`when` clauses decide *visibility* of a contribution in context (which service, which gadget, which state). Links decide *permission* on a resource. The UI shows a command only if its `when` clause is true **and** the target resource offers the matching link. The server is authoritative for both.

## Documentation system

Documentation lives in the repos as source plus rendered SVG, is regenerated in CI, and every page opens with one paragraph on how it serves the vision.

### Repository layout (decided: one monorepo, `armature`)

Everything lives in one new repository, created as `armature-platform` so the existing repositories are untouched. The current code is copied in without history (the original repositories keep theirs and are linked from the README). When you are comfortable, rename the old Angular repository (for example `armature-angular-legacy`) and archive it with the other two, then rename `armature-platform` to `armature`, so GitHub Pages serves `jayhamilton.github.io/armature` before INC-01 publishes the first problem type pages.

```text
armature/
  README.md, ROADMAP.md
  contracts/        lifecycles/*.json, schemas (gadgets, events, manifests), link relations; read by every stack
  backend/          armature-ms (Maven, Spring Modulith)
  web/              pnpm workspace
    packages/       core, elements
    hosts/          react, angular, svelte, lit, vanilla
  capabilities/     fiber, 5g, device-management, billing (mock services; may depend only on contracts/)
  docs/
    principles.md
    architecture/   c4/ (C4-PlantUML + SVG), modules/ (Modulith Documenter), sequences/, state/
    adr/            MADR format, one per decision
    api/            TMF 630 conformance, link relations, events/, AsyncAPI
    extension/      manifest reference, contribution points, first capability guide
    patterns/       generated pattern catalog and pattern pages
    security/       generated permissions matrix
    increments/     INC-00.md, INC-01.md, ...
    help/           gadgets/, problems/, tasks/, concepts/ (feeds the help panel, MCP resources, and the site)
    site/           Docusaurus configuration
  .claude/skills/   the Armature skills, defined once
  .github/workflows/  path filtered CI per stack plus cross stack conformance
```

- **One pull request per increment**, with its `INC-nn.md` report, spanning whichever stacks it touches.
- **Toolchains stay separate:** Maven under `backend/`, pnpm under `web/`; CI path filters avoid rebuilding what did not change.
- **Boundaries are enforced:** capabilities may import only `contracts/`; web hosts only the public entry points of `web/packages`.
- **Releases can still be independent** through per stack tags (`backend-v0.3.0`, `web-v0.9.0`).

### Diagram conventions

| Diagram | Source of truth | Rendered | Rule |
| --- | --- | --- | --- |
| C4 context, container, component | C4-PlantUML `.puml` (decided; the same toolchain as the sequences and the Modulith Documenter) | SVG committed next to source | One view per file; every element maps to a real package, module, or deployable |
| Sequence | PlantUML `.puml` | SVG | One per user visible scenario; participant names match class or service names |
| State | XState machine file (UI) and JSON lifecycle definition (shared) | SVG export, plus live view in Stately inspector | The diagram is generated from the machine that runs, never drawn by hand |
| API | OpenAPI from springdoc | HTML via Swagger UI | Link relations documented in `api/link-relations.md` |

A CI job renders `.puml` to SVG (PlantUML jar or the `plantuml` Maven plugin) and fails the build when a committed SVG is stale.

### Example sequence: ask, answer, pin, return

```text
@startuml ask-answer-pin
actor Customer
participant "Armature UI" as UI
participant "AgentRuntime" as Agent
participant "CapabilityRegistry" as Reg
participant "BoardService" as Boards
Customer -> UI : "Why was my bill higher?"
UI -> Agent : POST /agentRun (AG-UI stream)
Agent -> Reg : active tools for onAsk:billing
Agent --> UI : answer + gadget spec + _links.pin
Customer -> UI : Pin
UI -> Boards : POST {pin.href}
Boards --> UI : 201 GadgetInstance (_links.refresh, remove)
@enduml
```

### Increment report template (`docs/increments/INC-nn.md`)

1. **Goal and vision link:** which of the four outcomes this increment advances.
2. **What was built:** packages, endpoints, machines, gadgets, with links to code.
3. **Diagrams changed:** list of C4, sequence, and state files updated.
4. **Decisions:** ADRs added.
5. **Evidence:** tests added, a short demo script, screenshots or a GIF.
6. **Not done and why:** explicit scope cuts.
7. **Next increment's entry criteria.**

This is the same discipline the original MODEL\_INTEGRATION.md already shows, made uniform.

### User guide site (decided: static site generation over `docs/help`)

`docs/help` is built into a static user guide with [Docusaurus](https://docusaurus.io/) and published to GitHub Pages at `jayhamilton.github.io/armature`, the same host as the problem `type` URIs.

- **Why Docusaurus:** Meta maintained and active (passes the dependency policy), markdown and MDX from the same files the help panel already reads, versioned docs that follow `engines.armature`, built in GitHub Pages deployment, and React based, so MDX pages can render live `@armature/elements` gadgets as working examples.
- **Routes match identifiers:** `problems/` pages publish at exactly the paths used in `type` URIs; a CI check fails if any catalog entry has no published page.
- **Structured for agents:** each page emits JSON-LD (`TechArticle`, `HowTo`, `FAQPage`, `DefinedTerm`) from its front matter, so the published guide feeds the ontology and `search_help`.
- **One source, three outputs:** the same markdown renders in the in app help panel, on the static site, and as MCP resources for the assistant. Nothing is written twice.

## Error and help strategy

Every error is an [RFC 9457](https://www.rfc-editor.org/rfc/rfc9457.html) problem whose `type` URI resolves to a help page; that one help catalog feeds the error UI, the user documentation, and the assistant's answers.

### Why RFC 9457 instead of the TMF error object

RFC 9457 (which obsoletes RFC 7807) is the IETF standard, has native Spring support (`ProblemDetail`, `ErrorResponse`), allows extension members, and recommends that a problem `type` URI be dereferenceable to human readable documentation. That last point is what turns errors into help. TMF consumers that need the TMF shape can get it from an edge mapper (`code`, `reason`, `message`, `status`, `referenceError` map onto extension `code`, `title`, `detail`, `status`, `type`); the core never produces it. This deviation from TMF 630 is recorded as an ADR.

### The problem shape

```json
{
  "type": "https://jayhamilton.github.io/armature/problems/board-locked",
  "title": "This board is locked",
  "status": 409,
  "detail": "Board 'Network overview' is locked, so gadgets can't be added.",
  "instance": "/problems/7f3c2a",
  "code": "ARM-BOARD-409-LOCKED",
  "traceId": "4bf92f3577b34da6",
  "errors": [],
  "_links": {
    "help":   { "href": "/help/problems/board-locked" },
    "arm:unlock": { "href": "/board/42/unlock", "title": "Unlock this board" },
    "ask":    { "href": "/agentRun?problem=/problems/7f3c2a" }
  }
}
```

- **Standard members** (`type`, `title`, `status`, `detail`, `instance`) as the RFC defines them; `title` never varies per occurrence, `detail` does.
- **Extensions:** a stable `code` for logs and support, `traceId`, `errors[]` with JSON Pointers for validation (the RFC's own pattern), and `capability` when a capability caused it.
- **Remediation as HATEOAS:** `_links` offer what the user can do about it *in the current state* (`unlock`, `retry`, `reauthenticate`, `configure`). A problem is a state with exits, not a dead end.

### One help catalog, three consumers

Each problem type is one markdown file with front matter, stored beside the rest of the help:

```text
docs/help/
  problems/board-locked.md      type, title, status, code, cause, what to do, agent guidance
  gadgets/bar-chart.md          (the existing per gadget help, moved here)
  tasks/pin-an-answer.md        how-to guides
  concepts/capabilities.md      explanations
```

| Consumer | How it uses the catalog |
| --- | --- |
| **Error UI** | An `ErrorPresenter` shows `title` and `detail`, the remediation links as buttons, a *Learn more* that opens the page in the existing help panel, and *Ask the assistant* |
| **User documentation** | The same markdown builds the user guide site; every problem type automatically has a troubleshooting page |
| **GenAI** | Help pages are exposed as MCP resources (`help://problems/board-locked`) plus a `search_help` tool; the assistant receives the problem JSON with the page, so its answer is grounded in the catalog, cites it, and offers the same links |

**Problem type URIs (decided): identity is separate from location.**

- **`type` is one permanent, deployment independent URI** on GitHub Pages, for example `https://jayhamilton.github.io/armature/problems/board-locked`, published from `docs/help` as part of the user guide. Clients and agents recognize an error by this string, so it never changes, whoever runs Armature.
- **`_links.help` is where this deployment serves its own copy**, for example `/help/problems/board-locked`, with content negotiation (HTML for people, markdown or JSON for agents). A work deployment can serve internal or customized help there without touching the identifier.
- Rule for clients: recognize by `type`, open help by following `_links.help`, the same follow the link rule as the rest of the HATEOAS design.

### Errors on every surface

- **REST:** `application/problem+json`.
- **AG-UI:** `RUN_ERROR` events carry the problem object, so the panel uses the same `ErrorPresenter`.
- **MCP:** tool errors return `isError` with the problem as structured content.
- **A2A:** a failed task carries the problem as a data part.
- **Capabilities:** manifests contribute their own problem types and help (`contributes.problemTypes`), namespaced by capability.

### Enforcement

- A build test fails if any thrown domain exception has no catalog entry, or any catalog entry has no test that produces it.
- An ArchUnit rule forbids ad hoc error bodies; only the problem factory builds error responses.
- Help front matter is validated in CI (required sections: *What happened*, *Why*, *What you can do*, *For the assistant*).
- The skill `armature-add-problem-type` creates the exception, catalog page, mapping, and test together.

## Core abstractions and SOLID

Armature uses ports and adapters (hexagonal architecture): the domain defines a small set of ports, and every technology (Kafka, Teams, Ollama, Postgres) is an adapter behind one. An abstraction is introduced only when two implementations exist or are scheduled in this plan.

### Channels: one abstraction for every way a person is reached

Email, SMS, Microsoft Teams, and Slack are implementations of **Channel**. Following interface segregation, a channel is split into what it can do:

| Port | Responsibility | Implementations |
| --- | --- | --- |
| `OutboundChannel` | Deliver a message to an audience | Email, SMS, Teams, Slack, webhook |
| `InboundChannel` | Receive a question and hand it to the agent | Teams bot, Slack app, email reply (later) |
| `ChannelRenderer` | Turn Armature content into the channel's format | Email HTML, SMS text, Adaptive Card (Teams), Block Kit (Slack) |

- **Channel capabilities drive degradation.** Each channel declares what it supports (`interactive`, `rich`, `image`, `plainText`, `maxLength`). A gadget becomes an interactive card on Teams, an image plus link in email, and a one line summary plus link by SMS. The gadget never knows which channel it is going to.
- **Routing is a strategy.** A `ChannelRouter` picks channels from the person's preferences and the message's urgency; a failed delivery falls through to the next channel (Chain of Responsibility).
- **Every message links home.** Each rendering carries a link to the live board or pinned answer, so a channel is a doorway, never a copy that goes stale.
- **Capabilities can contribute channels** (`contributes.channels`), so a team that owns a new messaging platform adds it without touching Armature.

### Port catalog

| Port | Implementations in the plan | Pattern | Arrives in |
| --- | --- | --- | --- |
| `OutboundChannel`, `InboundChannel`, `ChannelRenderer` | Email, SMS, Teams, Slack | Strategy, Adapter, Chain of Responsibility | INC-09 |
| Domain events (no custom port) | Spring application events via Spring Modulith; Kafka externalization deferred | Observer | INC-02 |
| `DataSourceStrategy` | Static JSON, REST, MCP tool, A2A skill | Strategy | INC-04, INC-07, INC-08 |
| `GadgetRepresentation` | Custom element, MCP App, channel payload | Strategy keyed by gadget `@type` and media type | INC-07, INC-09 |
| `ModelProvider` | Ollama, Anthropic, OpenAI compatible gateway | Strategy, Chain of Responsibility, Decorator for metrics | INC-10 |
| `LifecycleEngine` | State pattern (sealed interfaces, no library) | State | INC-00, INC-02 |
| `CapabilitySource` | HTTP manifest, MCP server, A2A agent card | Adapter | INC-06 to INC-08 |
| `HelpCatalog` | Repo markdown, capability contributed help | Composite | INC-01, INC-06 |
| `BoardRepository` | In memory, PostgreSQL (Spring Data JDBC, JSONB) | Repository | INC-01 |

### SOLID, applied concretely

- **Single responsibility:** facades translate protocols; the domain decides; adapters talk to technology. A class that does two of these is split.
- **Open/Closed:** new behavior is a new adapter or manifest entry, found through a registry keyed by `@type`.
- **Liskov:** every adapter of a port passes the same contract test suite (one suite per port, run against each implementation).
- **Interface segregation:** ports are small and role specific (outbound vs inbound channel, publisher vs subscriber).
- **Dependency inversion:** the domain owns the port interfaces; adapters depend on the domain, never the reverse. ArchUnit enforces the direction.

### Where not to abstract

The layout grid, TMF 630 query parsing, the AG-UI event protocol, and RFC 9457 itself are single implementations of standards; wrapping them adds indirection without variation. Cross cutting concerns (metrics, retries, tracing) are decorators, not new layers.

## Modularity with Spring Modulith

armature-ms is one deployable made of verified application modules ([Spring Modulith](https://docs.spring.io/spring-modulith/reference/)); modules talk through published APIs or domain events, and both the structure and the runtime traffic can be inspected.

> Diagram (application modules · solid = API calls, dashed = events) is maintained in the planning doc; it is recreated here as C4-PlantUML in INC-00b.

Protocol modules call orchestration or domain APIs; domain modules never call each other's internals, and reactions such as notifying a customer travel as events into `channel`.

### Module rules

- A module is a top level package (`...armature.board`, `...armature.capability`). Its root package is its API; anything under `internal` is invisible to other modules.
- Extension points other modules or adapters implement are exposed as a named interface (`capability::spi`, `channel::spi`), not by opening the module.
- Allowed dependencies are declared with `@ApplicationModule(allowedDependencies = ...)`, so a new arrow in the diagram is a code change a reviewer sees.
- Reactions across modules prefer events over calls; calls are for queries and commands that need an answer.
- Hexagonal roles are marked with [jMolecules](https://github.com/xmolecules/jmolecules) annotations (`@Port`, `@Adapter`, `@PrimaryPort`, `@SecondaryAdapter`) and verified by its ArchUnit rules.

### Reasoning about it at each stage

| Stage | What you can see or prove | How |
| --- | --- | --- |
| Compile and build | No cycles, no access to another module's internals, only declared dependencies, correct hexagonal direction | `ApplicationModules.of(ArmatureApplication.class).verify()` plus jMolecules ArchUnit rules, run as tests |
| Documentation | C4-PlantUML component diagram per module and a module canvas (API, SPI, events published and consumed, configuration) | Modulith `Documenter`, output rendered to SVG under `docs/architecture/modules/` |
| Test | Each module boots and passes on its own; event driven flows asserted as scenarios | `@ApplicationModuleTest`, the Modulith `Scenario` API |
| Runtime | Module structure, cross module calls as trace spans, event publications not yet completed, active capabilities and their contributions | Actuator `modulith` endpoint, `spring-modulith-observability`, event publication registry, Armature's own capability registry resource |

### Compared with OSGi

OSGi gives runtime class loading, bundle install and uninstall, and a service registry inside one JVM. Armature splits those concerns:

- **Inside the process, modules are static** and verified at build time. No hot swapping, no class loader complexity.
- **Across processes, capabilities are dynamic.** A manifest plus an MCP server or A2A agent is the "bundle", and the capability registry plays the role of the OSGi service registry, over the network.
- **The lifecycles rhyme on purpose.** A capability's `DISCOVERED`, `VALIDATED`, `INACTIVE`, `ACTIVATING`, `ACTIVE`, `DISABLED` follow the same idea as OSGi's `INSTALLED`, `RESOLVED`, `STARTING`, `ACTIVE`, `STOPPING`, `UNINSTALLED`. The docs call this out as a comparison for readers who know OSGi.

### The UI side

The web packages follow the same rules; see the next section.

## Multi framework UI

React carries the plan as the reference application, and Angular, Lit, vanilla web components, and Svelte stay supported because everything below the host is framework free: a TypeScript core and a set of custom elements.

> Diagram (web layers · 5 hosts over shared elements and core) is maintained in the planning doc; it is recreated here as C4-PlantUML in INC-00b.

A host owns routing, layout chrome, and framework idioms; the elements and core own everything Armature means. Adding a sixth framework is a new thin host, not a port.

### The layers

| Package | Contents | Framework |
| --- | --- | --- |
| `@armature/core` | HAL client that follows links, local first store (IndexedDB) and sync engine, board and capability models, XState machines (board editing, assistant run, capability activation), `when` clause evaluator, RFC 9457 handling, AG-UI stream client, MCP Apps host bridge wrapper | None (TypeScript) |
| `@armature/elements` | `<armature-board>`, `<armature-gadget-host>`, `<armature-assistant>`, `<armature-help>`, `<armature-problem>`, and the built in gadgets | Lit (Google maintained, small, standards based) |
| `hosts/react` | The full reference application | React 19, which supports custom element properties and events natively |
| `hosts/angular` | A full application, the existing armature-ui moved onto core and elements | Angular with `CUSTOM_ELEMENTS_SCHEMA` |
| `hosts/svelte`, `hosts/lit`, `hosts/vanilla` | Embedding hosts: a board and assistant inside a small app, proving the contract | Svelte, Lit, plain HTML with no build step |

### The gadget contract is a custom element

- A gadget is a custom element registered by `@type`: the registry maps `@type` to a tag name and a lazy import, the same idea as today's `gadget-registry.ts`, now framework neutral.
- Inputs are properties (`config`, `data`, `semanticType`, `locked`); outputs are DOM events (`armature-configure`, `armature-action`, `armature-problem`); theming is CSS custom properties (the existing `--app-*` tokens) and `::part`.
- A gadget can be authored in Lit, vanilla, or Svelte compiled to a custom element; every host renders it unchanged. This is also what lets other teams contribute gadgets without adopting Armature's framework.
- Charts move to one framework free implementation (Chart.js, already used by the `present_chart` MCP App) instead of ngx-charts in Angular and Recharts in React.

### Keeping five hosts honest

- **One source of behavior:** hosts may not reimplement anything in core; dependency-cruiser enforces that hosts import only the public entry points of `core` and `elements`.
- **Host conformance suite:** the same Playwright scenarios (create a board, add a gadget, lock it, pin an answer, open a problem's help) run against every host in CI. This is the Liskov principle at the UI level.
- **Parity tiers:** React gets every feature first; Angular reaches parity on conformance scenarios within the same increment; Svelte, Lit, and vanilla must pass the embedding scenarios.
- **Repository:** the `web/` pnpm workspace inside the `armature` monorepo, with Vite builds; the current armature-ui becomes `web/hosts/angular` and armature-ui-react becomes `web/hosts/react`.

## Code as teaching material

Every class that implements a design pattern or embodies a SOLID decision says so in the code, and a build step turns those markers into a browsable pattern catalog, so the codebase can be taught from directly.

### Marking patterns in code

- **Architecture and domain roles** use jMolecules annotations (`@AggregateRoot`, `@ValueObject`, `@DomainEvent`, `@Port`, `@Adapter`), which are also verified.
- **Design patterns and SOLID** use two small annotations in a shared `patterns` package:

```java
@DesignPattern(pattern = Pattern.STATE, role = "ConcreteState",
               doc = "docs/patterns/state.md")
@SolidPrinciple(value = Principle.OPEN_CLOSED,
                note = "A new board state is a new class; no existing state changes.")
public record Published() implements BoardState { ... }
```

- **Javadoc follows one header shape** on every annotated type: *Pattern*, *Principle*, *Why here*, *How to extend*, *See also*.
- **TypeScript** uses custom TSDoc tags (`@pattern`, `@role`, `@principle`) declared in `tsdoc.json`, for XState machines, the gadget registry, and RxJS based services.

### The generated catalog

A `PatternCatalogTest` scans the annotations (and a script scans TSDoc tags) and writes `docs/patterns/index.md`: each pattern, every class playing each role, linked to source. The test fails when an annotation points to a missing page, or a page names a class that no longer exists, so the catalog cannot rot.

### Pattern page template (`docs/patterns/<pattern>.md`)

1. **Intent** in one sentence, in general terms.
2. **The problem in Armature** it solves, and the anti pattern it replaces (boolean flags, `switch` on type, copy pasted clients).
3. **Participants** mapped to real classes.
4. **Class diagram** in PlantUML; a sequence diagram if the pattern is about interaction.
5. **SOLID callout:** which principle it demonstrates and where exactly.
6. **Tests that prove it**, linked.
7. **Exercise:** a small extension a learner can make (for example add a `RESTORED` board state).

### Initial catalog

| Pattern | Where in Armature | Principle shown | Arrives in |
| --- | --- | --- | --- |
| State | Board, capability, pinned answer, composition lifecycles (Java); XState charts (UI) | Open/Closed | INC-00, INC-02 |
| Strategy with registry | Data sources, channels, gadget representations, model providers | Open/Closed, Dependency inversion | INC-04 onward |
| Adapter | Email, SMS, Teams, Slack, MCP and A2A capability sources, JSONB converter | Dependency inversion | INC-06, INC-09 |
| Chain of Responsibility | Channel fallback, model provider fallback | Single responsibility | INC-09, INC-10 |
| Decorator | Metrics, retries, tracing around ports | Open/Closed | INC-09 |
| Observer | Domain events (Java); RxJS streams (UI) | Loose coupling between modules | INC-02 |
| Command with undo | Board composition operations | Single responsibility | INC-03 |
| Composite | Help catalog, merged capability contributions | Liskov (a part and the whole answer the same way) | INC-01, INC-06 |
| Interpreter and Specification | TMF 630 filter expressions to queries | Single responsibility | INC-01 |
| Builder | RFC 9457 problem factory | Single responsibility | INC-01 |
| Mediator | Existing `EventService` in the UI (documented as found, not new) | Interface segregation | INC-00 |

The increment report gains a line, *Patterns introduced*, and `armature-architecture-review` flags any new strategy, adapter, or state class that lacks its annotation.

## Dependency policy

A library is allowed only if it is backed by a foundation or vendor, or is clearly active (a release within 12 months and more than one maintainer), and supports the current Spring Boot major and the current major of each supported UI framework. Anything in the domain path also has to sit behind a port so it can be replaced. Otherwise the code is written in house, which also gives it teaching value.

| Dependency | Verdict | Reason |
| --- | --- | --- |
| Spring Statemachine | **Removed** | Maintenance mode, [no Boot 4 plan](https://github.com/spring-projects/spring-statemachine/issues/1207); replaced by the State pattern |
| opentmf tmf630-toolkit | **Not adopted** | Very small community project; TMF 630 querying written in house in the `tmf` module |
| `ace-editor-builds` (UI) | **Remove** | Stale duplicate of `ace-builds`, which the UI already uses |
| spring-ai-a2a (community, 0.3.0) | **Watch** | Pre 1.0 community module; isolated in the `a2a` module behind an adapter, compared against the A2A project's own Java SDK in INC-08 |
| `@swimlane/ngx-charts` (UI) | **Retire** | Lags Angular majors ([Angular 22 support issue](https://github.com/swimlane/ngx-charts/issues/2085)); retired in INC-04 when chart gadgets become custom elements drawn with Chart.js (Recharts in the React port retires with it) |
| Spring Boot, Spring AI, Spring HATEOAS, Spring Modulith (Spring for Apache Kafka added only when Kafka is adopted) | Keep | Vendor maintained, Boot 4 line |
| jMolecules, ArchUnit | Keep | Active, used by Spring Modulith itself |
| MCP Java and TypeScript SDKs, `@modelcontextprotocol/ext-apps` | Keep | Official protocol SDKs |
| CloudEvents SDK | Keep | CNCF project |
| XState | Keep | Vendor maintained (Stately) |
| PlantUML, C4-PlantUML, dependency-cruiser | Keep | Active, build time only |
| Angular Material, JSON Forms, marked | Keep | Vendor or foundation maintained |
| PostgreSQL, Spring Data JDBC, Flyway, Testcontainers | Keep | Foundation or vendor maintained; chosen in ADR-0003 |
| React, Angular, Lit, Svelte, Chart.js, Vite, pnpm, Playwright | Keep | Vendor or foundation maintained, or large active communities; the web stack for all hosts |
| Docusaurus | Keep | Meta maintained; builds the user guide from docs/help |
| Spring Security 7 (OAuth2 client, resource server, and the built in authorization server) | Keep | Vendor maintained; the authorization server ships inside Spring Security 7, so no external identity provider is needed |

The policy is ADR-0005, re-checked in each increment report.

## Events and pub/sub

Armature is **event ready, not yet on Kafka**: domain events are published in process with Spring Modulith and recorded durably in PostgreSQL, and are shaped for Kafka from day one, so adopting Kafka later is a dependency and configuration change rather than a redesign.

### Emitting

- **Domain events are facts in past tense:** `BoardPublished`, `BoardLocked`, `GadgetInstanceAdded`, `AnswerPinned`, `PinnedAnswerRefreshed`, `CapabilityActivated`, `CapabilityFailed`. The lifecycle engine raises them on transitions, so events and states never disagree.
- **No custom event port.** Events are records marked with jMolecules `@DomainEvent` and published through Spring's `ApplicationEventPublisher`. [Spring Modulith](https://docs.spring.io/spring-modulith/reference/events.html) already is the abstraction, and with one implementation today a home grown `EventPublisher` port would be indirection without variation.
- **Durable from the start.** Modulith's JDBC event publication registry records each event in the same PostgreSQL transaction as the change; incomplete publications are retried on restart. This is the outbox Kafka will read from later.
- **Kafka shaped from the start.** Each event has a stable type name (`dev.armature.board.published`), a `subject` equal to the aggregate id (the future partition key), a schema version, and a JSON Schema. The mapping to [CloudEvents](https://cloudevents.io/) attributes is documented now; no CloudEvents or Kafka library is added yet.

### Listening

- **In process handlers** use `@ApplicationModuleListener` (asynchronous, after commit): marking pinned answers stale, triggering refreshes, asking the `ChannelRouter` to notify.
- **Idempotent from day one:** handlers dedupe on event id, so replaying from Kafka later is safe without changes.
- **Webhooks are another listener.** The TMF style `/hub` subscription resource delivers the same events to external HTTP subscribers today.
- **Capabilities declare events in their manifest** (`contributes.events` with schemas, and `onEvent:` activation). These work with in process events and webhooks now, and with Kafka topics later.

### Documentation and contracts

- An [AsyncAPI](https://www.asyncapi.com/) document per service lists channels, messages, and schemas; CI validates it and fails on a breaking schema change.
- Schema evolution is additive; a breaking change is a new event `type` version (`dev.armature.board.published.v2`), never an in place edit.
- Each event gets a catalog page (`docs/api/events/`) and a PlantUML sequence for its main reaction.

### Adding Kafka later (deferred increment)

When a real need appears, one increment adds Kafka without touching domain code:

1. Add `spring-modulith-events-kafka` (and Spring for Apache Kafka).
2. Mark events for externalization with `@Externalized("armature.board.events::#{subject}")` or configuration, one topic per aggregate, keyed by `subject`.
3. For inbound events, add a `@KafkaListener` adapter in an `integration` module that republishes them as application events; existing handlers stay unchanged.
4. Adopt CloudEvents binary mode headers and bind the AsyncAPI channels to the topics.
5. Choose JSON Schema or Avro to match the adopting organization's schema registry.

The event contract tests written from INC-02 onward verify that nothing changes in behavior when the transport does.

## Real time updates: SSE, not WebSockets (decided)

Server Sent Events are sufficient for gadget updates, and the same transport already carries AG-UI and MCP streamable HTTP; WebSockets are reserved for a future need this plan does not have.

### Why SSE fits

- **The traffic is one way.** Updates flow server to client (data changed, board changed, agent output). Client to server writes already go through REST (`PATCH` with `If-Match`, links), which is where they belong for validation, lifecycle rules, and problems.
- **Missed events are replayed.** SSE reconnects automatically and sends `Last-Event-ID`; the server replays from the event publication registry. That is exactly what local first sync needs after a laptop sleeps or a train tunnel.
- **It is plain HTTP.** It passes through CDNs, corporate proxies, and gateways that often break or time out WebSockets, and it uses the same authentication as the REST API.
- **HTTP/2 removes the old limit.** Streams are multiplexed over one connection, so the historical six connections per browser cap no longer applies.

### How gadgets get updates

- **One stream per client, not per gadget:** `GET /eventStream?board={id}` delivers board events and data change notices for every gadget on the board; `@armature/core` fans them out to gadget elements.
- **Thin events plus links:** an update says what changed and carries the link to fetch it; small metric deltas may be inlined. Gadgets refetch through the same HAL representations, so there is one read path.
- **Data sources declare how they update:** `updateMode` of `push` (the source emits changes, for example MCP `resources/updated` or a webhook), `poll` (the server polls on an interval so the browser does not), or `none`.
- **Coalescing protects attention:** updates per gadget are rate limited with latest wins (for example at most one per second), so a noisy source cannot turn a calm board into a flickering one.
- **Server side:** Spring MVC `SseEmitter` on Java 25 virtual threads, matching the existing `/api/agent/chat` streaming.

### When WebSockets would be the right call

True bidirectional, high frequency traffic: real time co editing with CRDTs, shared cursors, or interactive control loops. All are out of scope; if one arrives, the transport lives inside a single `core` stream client module, so a WebSocket implementation can be added there without touching gadgets or hosts.

Recorded as an ADR in INC-04, where streaming gadget data first appears.

## Authentication and authorization

Armature speaks standard OIDC and OAuth 2.1 from day one but issues its own tokens and keeps roles and permissions in PostgreSQL, behind two small abstractions, so adopting an enterprise identity provider later (for example Microsoft Entra) is configuration plus one adapter, not a rewrite.

### Authentication: OIDC shaped, no external provider

- **Armature runs its own authorization server** in an `identity` module, using Spring Authorization Server, which [moved into Spring Security 7](https://spring.io/blog/2025/09/11/spring-authorization-server-moving-to-spring-security-7-0/) and so adds no dependency beyond Spring. It publishes a standard issuer, discovery document, JWKS, and authorization code with PKCE. Users and hashed passwords live in PostgreSQL.
- **Everything else is a plain OIDC client or resource server** pointed at an issuer URI. The UI signs in through a backend for frontend session (an HttpOnly cookie, which also authenticates the SSE stream); MCP clients and A2A peers present bearer tokens validated by issuer and audience.
- **Nothing outside the `identity` module knows the issuer is local.** Switching to an external provider such as Entra means changing `issuer-uri` and client registrations and switching the `identity` module off; no controller, policy, or UI code changes.
- **Standalone local first mode** has no backend and therefore no login, as today.

### Authorization: roles and permissions, owned by Armature

The domain defines permissions; roles are bundles of permissions; users are assigned roles at a scope.

| Table (PostgreSQL) | Holds |
| --- | --- |
| `permission` | Fine grained codes: `board:read`, `board:edit`, `board:publish`, `board:lock`, `board:share`, `board:archive`, `agent:compose`, `answer:pin`, `capability:manage`, `org:manage`, `audit:read` |
| `role` | Named bundles with a scope type: Viewer, Editor, Owner (board); Org Admin, Support Agent (organization); Capability Admin, Platform Admin (platform) |
| `role_permission` | Which permissions each role grants; seeded by Flyway, editable by admins |
| `role_assignment` | User, role, scope type, scope id; sharing a board is simply an assignment at board scope |
| `external_role_mapping` | Empty for now; later maps provider roles or groups (for example Entra app roles) to Armature roles |

### The two abstractions

| Port | Question it answers | Adapter now | Adapter later |
| --- | --- | --- | --- |
| `ActorResolver` | Who is calling, in which organization, with which roles? Turns any authenticated principal into an Armature `Actor` | Reads assignments from PostgreSQL for the local user | Maps Entra `oid`, `tid`, and `roles` claims through `external_role_mapping`, alone or combined with database assignments |
| `AccessPolicy` | May this actor do this action on this resource in its current state? | Permissions from roles at the matching scope, plus tenant and lifecycle rules | Unchanged; it never sees where roles came from |

### How the policy drives the UI and the API

1. **HAL links are the UI's permission model.** For every candidate link, the assembler asks `AccessPolicy`; a link appears only if the lifecycle allows the transition and the actor holds the permission. The UI shows the lock toggle because `arm:lock` is present, never because it checked a role.
2. **The root resource carries global affordances.** `GET /` returns links such as `arm:admin`, `arm:capabilities`, or `arm:audit` only for actors who may use them, so menus appear or disappear the same way.
3. **The API enforces the same decision.** Spring Security method security (`@PreAuthorize("hasPermission(#id, 'Board', 'board:publish')")`) calls a `PermissionEvaluator` that delegates to `AccessPolicy`. Links and enforcement cannot disagree because they ask the same question of the same code.
4. **Refusals are problems:** `authentication-required` (401) and `not-permitted` (403), each with a help page.
5. **Agents act as the user.** Assistant tools, MCP tools, and A2A tasks run with the requesting actor, and tool lists are filtered by the policy.

### Guardrails

- A table driven authorization matrix test (role by permission by lifecycle state) runs in CI and generates `docs/security/permissions.md`.
- Both `ActorResolver` adapters must pass one contract test suite when the second one arrives.
- Cross tenant access attempts are part of the test suite.
- Role and permission management is exposed as HAL resources (`/role`, `/roleAssignment`) behind `org:manage` and `capability:manage`.
- Teaching value: `AccessPolicy` shows Strategy and Specification; `ActorResolver` shows Adapter and Dependency inversion.

## Ontology with schema.org

[schema.org](https://schema.org/) gives capabilities a shared vocabulary, so services built by different teams describe the same things the same way and the agent can reason across them. It is used where it helps and extended only where it has no term.

### Where it applies

| Armature concept | schema.org type | What it enables |
| --- | --- | --- |
| Customer, account | `Organization`, `Person` | One identity across capabilities |
| A customer's service | `Service` (with `provider`, `serviceType`) | Joining billing, network, and support data about the same service |
| Gadget data | `Dataset`, `Observation`, `StatisticalVariable`, `Invoice`, `Order` | The agent picks a gadget from the data's meaning: observations over time suggest a line chart, an `Invoice` suggests a statement view |
| Data source | `DataFeed`, `DataCatalog` | Discoverable, describable data in manifests |
| Board, pinned answer | `CreativeWork` with `ItemList` of parts | Boards are describable and shareable as content |
| State gated links | `potentialAction` with `Action` and `EntryPoint` (`urlTemplate`, `httpMethod`) | A schema.org view of the same HATEOAS affordances |
| Capability | `SoftwareApplication` | Catalog metadata for manifests |
| Help pages | `HowTo`, `FAQPage`, `TechArticle` | Structured help the assistant can quote and cite |
| Problem types and glossary | `DefinedTerm` in a `DefinedTermSet` | A browsable, linkable error and concept vocabulary |

### How it coexists with TMF 630

TMF `@type` stays the polymorphism key for resources, as TMF 630 requires. schema.org meaning is added, not substituted:

- Manifests and data source declarations carry `semanticType` (for example `"semanticType": "schema:Invoice"`).
- The same resource is available as JSON-LD (`Accept: application/ld+json`) with an Armature `@context` that maps its fields to schema.org terms.
- Help pages embed JSON-LD so the published user guide is structured for search and for agents.

### Rules

- Prefer an existing schema.org term; where none fits, use the TMF information model (SID) term; only then add an `armature:` term, documented in `docs/ontology/`.
- The manifest validator checks that every `semanticType` resolves.
- The agent's system prompt is given the semantic types of active data sources, not raw field lists; this is where the ontology pays off for GenAI.

## GenAI skills for extension

Each extension seam gets a skill that encodes the pattern, generates the code, docs, and tests together, and refuses to finish until its checks pass. Neither repo has skills yet (only `.claude/settings.local.json`), so they are introduced one per increment, exactly when the seam they encode exists.

| Skill | Used by | Produces | Must pass before done |
| --- | --- | --- | --- |
| `armature-add-gadget` | Armature and capability authors | Custom element (Lit, vanilla, or Svelte), `library.json` entry with `@type`/`@baseType` and `semanticType`, registry entry, help page, one test | Schema validates; gadget renders in the test harness; help page exists |
| `armature-add-rest-resource` | armature-ms | Controller, HAL assembler with state gated links, TMF 630 query handling, OpenAPI annotations | TMF 630 conformance suite; link relations added to catalog; errors only via the problem factory |
| `armature-add-problem-type` | Both, capability authors | Exception, RFC 9457 mapping, remediation links, help catalog page with agent guidance, test | Every thrown exception has a catalog page; every page has a test that produces it |
| `armature-add-lifecycle` | Both | JSON lifecycle definition, `LifecycleEngine` config, XState machine, link rules, domain events, state SVG | Java transitions, XState transitions, link rules, and events agree with the JSON definition |
| `armature-add-data-source` | armature-ms | A `DataSourceStrategy` keyed by `@type`, config schema, `semanticType`, contract test | Registered by type; passes the port's contract suite; no edits to existing strategies |
| `armature-add-channel` | armature-ms, capability authors | `OutboundChannel` (and optional `InboundChannel`) adapter, `ChannelRenderer`, capability declaration | Channel port contract suite; golden files for every built in gadget type |
| `armature-add-event` | Both | Event record, JSON Schema, CloudEvents type, AsyncAPI entry, catalog page, handler stub | AsyncAPI validates; schema change is additive; consumer is idempotent |
| `armature-create-capability` | Other teams | Manifest, MCP server stub, sample gadget, help and problem pages, local run script | Manifest validates against `engines` and semantic types; activates in a local Armature |
| `armature-document-increment` | You | `INC-nn.md` from the template, updated diagrams list, ADR stubs | Every changed package appears in a C4 view; stale SVG check passes |
| `armature-architecture-review` | You, before merge | A review against the principles and the port catalog | No `switch` on type; no rule in a facade; no link without a state rule; dependencies point inward |

### How the skills stay honest

- Skills reference the repo's own docs (`docs/architecture`, `docs/api/link-relations.md`) rather than restating rules, so the rules live in one place.
- Each skill ends by running the checks listed above; failing checks mean the skill reports, not "done".
- `armature-create-capability` is the one external teams see. It is the practical form of the argument: adding a service is a manifest and a small server, not a new portal.

## Incremental build plan

Eleven increments, each small enough to finish, demo, and document on its own; nothing starts until the previous increment's report is written.

| Inc | Theme | Demo at the end | Vision outcome |
| --- | --- | --- | --- |
| 00a, 00b, 00c | Scaffold, docs and CI, modules and patterns | New repo builds and runs as before; ADRs and baseline C4; verified modules | All |
| 01 | Board resources (TMF 630) | Boards follow you from laptop to phone | Deliver anywhere |
| 02 | Board lifecycle and HATEOAS | Lock, publish, share appear only when the server offers the link | No assumptions |
| 03 | Agent on real state | "Build me a board for my services" with preview and undo | No assumptions |
| 04 | Data source strategies | Gadgets show live data from Fiber, 5G, Device Management, and Billing | Consolidation |
| 05 | Ask, answer, pin, return | A pinned answer refreshes itself next week | Return to information |
| 06 | Capability manifests | Register a service, its menus and gadgets appear; remove it, they vanish | Consolidation |
| 07 | MCP capabilities and MCP Apps as gadgets | A third party MCP server becomes a capability with zero Armature code | Consolidation |
| 08 | A2A agent | A peer agent asks Armature for a board and gets it back as an artifact | Deliver anywhere |
| 09 | Events and channels | Monday digest of a board posted to Teams and email | Deliver anywhere |
| 10 | Production shape and the demo | Side by side: traditional portals vs Armature, measured | The argument |

### Demo services and scenario

Four mock services stand in for a customer's portfolio, each built as a separate capability so the demo proves consolidation rather than asserting it.

| Service | Contributes | Semantic type | TMF shaped API | Events |
| --- | --- | --- | --- | --- |
| Fiber | Connection health, outage timeline, repair ticket command | `Service`, `Observation` | TMF638 Service Inventory, TMF642 Alarm, TMF621 Trouble Ticket | `connection.degraded`, `outage.resolved` |
| 5G | Data usage, signal and coverage, failover lines | `Service`, `Observation` | TMF638 Service Inventory, TMF635 Usage | `usage.threshold.exceeded` |
| Device Management | Device inventory, firmware status, failover state, reboot command | `IndividualProduct` | TMF639 Resource Inventory | `device.failover`, `device.offline` |
| Billing | Statement, charges by service, anomaly explanation | `Invoice`, `Order` | TMF678 Customer Bill | `bill.issued`, `charge.anomaly` |

**The scenario:** a business customer asks *"Why was my bill higher this month, and is it related to last week's fiber outage?"* The answer needs all four: Fiber shows the outage window, Device Management shows the routers failing over, 5G shows the data usage spike during failover, and Billing shows the resulting overage charge. In the traditional model that is four portals; in Armature it is one question, one composed board, one pinned answer, and a Teams message when the credit posts.

### INC-00a Scaffold the new repository

- **Scope:** create `armature-platform` as a new repository (renamed to `armature` later, see Repository layout); root `README.md`, `ROADMAP.md`, `CLAUDE.md`, `.gitignore`, `pnpm-workspace.yaml`; copy the current code in without history: armature-ms (including the pending ChartsApp files) to `backend/`, the Angular app to `web/hosts/angular`, the React port to `web/hosts/react`; fix cross references between them; README credits and links the original repositories for their history.
- **Expected outcome:** `backend` tests pass, both UI hosts build and run against the backend, exactly as they did in their own repositories. No behavior changes.
- **Documentation:** INC-00a report, ADR-0001 (record decisions), ADR-0002 (monorepo, fresh history).

### INC-00b Documentation, contracts, and CI

- **Scope:** `docs/` skeleton with principles, the plan, and ADRs for every decision already made; `contracts/` and `capabilities/` placeholders; C4 context and container of the current system in C4-PlantUML with rendered SVG; path filtered CI for backend and each host, plus the stale SVG check; dependency audit against the dependency policy (remove `ace-editor-builds`).
- **Expected outcome:** CI green on every stack; diagrams render from source; every dependency has a policy verdict.
- **Documentation:** INC-00b report, ADR-0003 to ADR-0014 (the decisions recorded in this plan), baseline C4 SVGs.
- **Skills introduced:** `armature-document-increment`, `armature-architecture-review`.

### INC-00c Modules and reference patterns

- **Scope:** restructure `backend/` into Spring Modulith application modules with the verification test and Documenter output; add jMolecules and the `@DesignPattern` and `@SolidPrinciple` annotations with `PatternCatalogTest`; implement `LifecycleEngine` and the board lifecycle as the State pattern reference; initial `web/packages/core` and the ADR for the custom element gadget contract.
- **Expected outcome:** `ApplicationModules.verify()` passes; the pattern catalog lists State and Strategy registry; the board lifecycle has tests for every transition.
- **Documentation:** INC-00c report, `docs/patterns/state.md`, module diagrams.

### INC-01 Board resources

- **Scope:** `board`, `board/{id}/row`, `gadgetInstance` resources with `id`, `href`, `@type`; `fields`, filtering, `offset`/`limit`, both PATCH media types; RFC 9457 problem factory and the first help catalog entries (`docs/help/problems/`), with the existing gadget help moved into `docs/help/gadgets/`; PostgreSQL persistence through Spring Data JDBC with Flyway migrations, and the board version exposed as an ETag with If-Match required on PATCH; identity module with Armature's own OIDC authorization server and BFF login, role, permission, and role\_assignment tables, organizations as tenants, board sharing as board scoped assignments, ActorResolver and AccessPolicy with the authorization matrix test; UI becomes local first with background sync and gets the `ErrorPresenter`.
- **Expected outcome:** A board created in one browser appears in another; edits made offline sync on reconnect, and a concurrent edit produces a board-version-conflict problem with working remediation links; a `.http` file exercises every TMF 630 rule and passes; every error the API can return has a published page at its `type` URI.
- **Documentation:** Container and armature-ms component C4 updated; sequence *board sync*; `api/tmf630-conformance.md`; ADR on RFC 9457 over the TMF error object; first user guide build from `docs/help`.
- **Skills introduced:** `armature-add-rest-resource`, `armature-add-problem-type`.

### INC-02 Board lifecycle and HATEOAS

- **Scope:** Board lifecycle `DRAFT`, `PUBLISHED`, `LOCKED`, `ARCHIVED` through `LifecycleEngine`; HAL assembler emitting links gated by both lifecycle state and the AccessPolicy; remediation links on problems; lifecycle transitions publish domain events as Spring application events, recorded in the JDBC event publication registry, with Kafka shaped names, subjects, and schemas; UI renders lock, publish, remove, configure from links; XState *board editing* machine in the UI.
- **Expected outcome:** Removing the `lock` rule on the server removes the lock toggle in the UI with no UI change; the lifecycle conformance test passes; each transition produces exactly one event.
- **Documentation:** State SVG for board lifecycle; `api/link-relations.md`; first entries in `api/events/`; sequence *lock a board*.
- **Skill introduced:** `armature-add-lifecycle`.

### INC-03 Agent on real state

- **Scope:** Agent tools call `BoardService` instead of returning intents; MCP surface secured with MCP authorization (OAuth protected resource metadata), tools run as the requesting user, and reduced to `navigate_boards` (HATEOAS traversal) plus `compose_board`; `BoardComposition` task resource (`PROPOSED`, `APPLIED`, `REJECTED`, `UNDONE`); XState *assistant run* machine for the panel; help catalog exposed as MCP resources plus `search_help`; *Ask the assistant* on any problem; semantic types on gadget library entries.
- **Expected outcome:** One request builds a full board, shown as a diff, applied atomically, undoable. Tool count drops from 7 to 3 or fewer; tool selection accuracy measured before and after on a fixed prompt set. Asking about an error returns an answer that cites its help page and offers its remediation links.
- **Documentation:** Sequence *compose a board* and *explain an error*; state SVGs for composition and assistant run; ADR on the HATEOAS MCP pattern citing the HATEOAS and MCP article.

### INC-04 Data source strategies

- **Scope:** Finish SPEC-73 as `DataSourceStrategy` (`StaticJsonSource`, `RestSource`); the four demo services (Fiber, 5G, Device Management, Billing) as mock services with TMF shaped APIs; data source updateMode (push, poll, none) and the per client SSE event stream with Last-Event-ID replay and per gadget coalescing; built in gadgets rebuilt as custom elements in @armature/elements (charts on Chart.js), rendered unchanged by the React and Angular hosts.
- **Expected outcome:** Gadgets bind to live mock data; adding `RestSource` required no edit to `StaticJsonSource` or the gadget host.
- **Documentation:** Component C4 for data sources; sequence *gadget data fetch*.
- **Skill introduced:** `armature-add-data-source`.

### INC-05 Ask, answer, pin, return

- **Scope:** Every agent answer that carries a gadget spec gets a `pin` link; `PinnedAnswer` resource bound to its data source and query, lifecycle `FRESH`, `STALE`, `REFRESHING`, `FAILED`; finish the `present_chart` dashboard path.
- **Expected outcome:** Ask a question, pin the answer, change the mock data, and the pinned gadget shows the new value.
- **Documentation:** Sequence *ask, answer, pin, return* (the example above, now real); state SVG for pinned answer.

### INC-06 Capability manifests

- **Scope:** Manifest JSON Schema, `CapabilityRegistry`, capability lifecycle, activation events, `contributes` for gadgets, commands, menus with `when`, configuration, help; UI contribution renderer; the four demo services repackaged as capabilities.
- **Expected outcome:** Registering the Fiber capability adds its connection health gadget, its repair ticket menu item on degraded connections, and its help, with no Armature release; disabling it removes them cleanly.
- **Documentation:** `extension/manifest-reference.md`, contribution point catalog, sequence *capability activation*, capability lifecycle SVG.
- **Skills introduced:** `armature-create-capability`, `armature-add-gadget`.

### INC-07 MCP capabilities and MCP Apps as gadgets

- **Scope:** Phase 4 MCP client; `McpToolSource` strategy; MCP tools contributed with prefixes and filters; MCP App `ui://` resources as gadget types with the Phase 5 sandbox, origin allowlist, and message validation; manifest `trust` levels.
- **Expected outcome:** Point Armature at an unmodified third party MCP server with a two line manifest and its tools and app appear.
- **Documentation:** ADR on MCP App trust model; sequence *MCP App gadget render*.

### INC-08 A2A agent

- **Scope:** Activate the A2A autoconfiguration; agent card with goal level skills (`compose-board`, `answer-with-gadget`, `summarize-board`); executor over `AgentRuntime`; results as artifacts (text, gadget or board JSON as a data part, link to the board); agent card security schemes, client credentials, and the acting user carried as a delegated claim so the peer and the user it acts for both pass through the AccessPolicy; optional A2A client source for peer service agents.
- **Expected outcome:** A test peer agent requests a billing board for a customer and receives a usable artifact; unauthorized callers are refused.
- **Documentation:** Context C4 updated with peer agents; sequence *A2A board request*; A2A task state SVG.

### INC-09 Events and channels

- **Scope:** capability `contributes.events` and `onEvent:` activation over in process events; `/hub` webhooks as a listener; AsyncAPI document for messages and schemas; the Channels abstraction with Email, SMS, Teams, and Slack adapters, renderers, and the `ChannelRouter`; scheduled digests. Kafka stays deferred.
- **Expected outcome:** A `connection.degraded` event from the Fiber mock (delivered by webhook) marks a pinned answer stale, refreshes it, and notifies the customer on their preferred channel; the same digest renders correctly on all four channels with a link back to the live board; the Kafka readiness checklist is reviewed and still holds.
- **Documentation:** AsyncAPI document; event catalog pages; sequence *event to notification*; channel capability matrix.
- **Skills introduced:** `armature-add-channel`, `armature-add-event`.

### INC-10 Production shape and the demo

- **Scope:** Security hardening (audit trail review, PostgreSQL row level security, a penetration test of REST, MCP, and A2A); Phase 3 provider fallback with fallback rate metrics; the side by side demo script with one persona and one question.
- **Expected outcome:** Measured comparison: time to answer, clicks, distinct UIs learned, and code needed to add a service (manifest vs portal).
- **Documentation:** Final C4 set; demo guide; a blog post draft built from the increment reports.

## Guardrails against GenAI slop

You stay the architect: every increment is small enough to read in one sitting, and every rule below is enforced by a test or a review step, not by trust.

1. **Spec before code.** Each increment starts with a SPEC in `.work/specs` you approve; generated code outside the spec's scope is rejected.
2. **Diagram before code for new seams.** A new component appears in the C4 component view first. If it cannot be placed in a C4 view, it should not exist.
3. **Executable architecture rules.** ArchUnit tests in armature-ms: facades depend only on the domain layer; no `switch` or `instanceof` chains on `@type`; strategies are registered, never referenced by concrete class outside the registry.
4. **One definition per lifecycle.** The JSON lifecycle definition is tested against the Java engine, the XState machine, and the link rules. Drift fails the build.
5. **Conformance suites, not vibes.** TMF 630 behaviors and link relations each have a test suite that every new resource must pass.
6. **Readable increments.** Target under about 1,500 changed lines per increment excluding generated SVG; larger means split it.
7. **The increment report is the gate.** You read `INC-nn.md` and the diagrams, not the diff first. If the report does not explain a change in terms of the vision, the change is questioned.
8. **Measured claims only.** Statements such as "fewer tools improves accuracy" are backed by a fixed prompt set and recorded numbers in the report.
9. **Honest scope cuts.** Every report has a *not done and why* section, the same candor MODEL\_INTEGRATION.md already has.

## Open questions

- [ ] **Kafka (deferred):** when events are needed beyond the process, confirm the target environment's managed Kafka and schema registry; that decides JSON Schema vs Avro.
- [ ] **Production identity provider:** deferred. Armature runs its own OIDC issuer with roles and permissions in PostgreSQL; an enterprise provider such as Microsoft Entra is adopted later through issuer configuration and an Entra ActorResolver adapter.

## Sources

- [HATEOAS as the Cure for MCP Tool Bloat](https://jaystevenhamilton.medium.com/) (Steve Hamilton)
- [TMF630 REST API Design Guidelines v5.0.0](https://www.tmforum.org/resources/specifications/tmf630-rest-api-design-guidelines-5-0-0/)
- [opentmf tmf630-toolkit](https://github.com/opentmf/tmf630-toolkit)
- [RFC 9457 Problem Details for HTTP APIs](https://www.rfc-editor.org/rfc/rfc9457.html)
- [Spring Statemachine: Spring Boot 4 support issue #1207](https://github.com/spring-projects/spring-statemachine/issues/1207)
- [Spring Modulith reference](https://docs.spring.io/spring-modulith/reference/)
- [Spring Modulith: working with application events](https://docs.spring.io/spring-modulith/reference/events.html)
- [Spring Modulith Kafka externalization API](https://docs.spring.io/spring-modulith/docs/current/api/org/springframework/modulith/events/kafka/package-summary.html)
- [jMolecules](https://github.com/xmolecules/jmolecules)
- [dependency-cruiser](https://github.com/sverweij/dependency-cruiser)
- [ngx-charts: Support Angular 22 issue #2085](https://github.com/swimlane/ngx-charts/issues/2085)
- [spring-ai-a2a (community)](https://github.com/spring-ai-community/spring-ai-a2a)
- [CloudEvents](https://cloudevents.io/)
- [AsyncAPI](https://www.asyncapi.com/)
- [schema.org](https://schema.org/)
- [VS Code extension manifest reference](https://code.visualstudio.com/api/references/extension-manifest)
