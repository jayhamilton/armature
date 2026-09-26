# Armature

**Ask a question. Get back a live board that answers it.**

A business customer wants to know: *"Why was my bill higher this month, and is it related to last
week's fiber outage?"* Today that means four portals (fiber, 5G, device management, billing),
four logins, four layouts, and the customer doing the joining in their head. Every service built
its own interface, and nobody built the one the question needed.

Armature turns that around. **Services describe what they know; the interface is composed on
demand, for the question in front of you.** An agent reads the question, finds the services that
can answer it, and assembles a board: the outage window from Fiber, the routers failing over from
Device Management, the data spike on the 5G backup line, the overage charge from Billing. You can
refine it, pin it, and come back next week to find it still live, because a pinned answer is a
gadget bound to its query, not a screenshot.

Portals are built. Armature boards are composed.

## AI native, not AI added

Most applications bolt an assistant onto a UI designed for clicking. In Armature, agents are
first class users of the same system people use:

- **Boards are data, not code.** A board is a set of gadget resources described by schemas, so an
  agent can compose, change, and explain one as readily as a person can drag one together. There
  is no screen an agent cannot build.
- **The API tells every client what is possible right now.** Resources carry state gated
  hypermedia links: a draft board offers *publish*, a locked board offers no edit links at all.
  People see buttons because a link is present; agents act because a link is present. Instead of
  hundreds of hard coded tools, an agent navigates a few entry points and follows links, the
  approach from *HATEOAS as the Cure for MCP Tool Bloat*.
- **Every door leads to the same boards.** The Armature UI, any MCP client (Claude, VS Code,
  Goose), peer agents over A2A, and channels such as Teams and email all reach the same resources
  under the same permissions. An agent acts as the user it serves, never with more access.
- **Capabilities extend the agent and the UI in one move.** A service joins Armature with a
  manifest, modeled on VS Code extensions, that contributes gadgets, data sources, commands,
  *and* agent tools. Add a service and the assistant learns what it knows; remove it and both the
  menus and the tools disappear.
- **Answers become interfaces.** When the assistant answers, it returns a gadget, not just prose.
  That gadget can be pinned to a board, refreshed from its source, and shared.

## Where it stands

Armature is being rebuilt in small, documented increments (see [`ROADMAP.md`](ROADMAP.md)).
**Working today:** a board runtime with 11 configurable gadgets in the Angular reference UI (with a
React port in progress); an assistant that edits boards through tool calls and schema constrained
output, streamed over AG-UI, on a local Ollama model or Anthropic; and an MCP server exposing 7
board tools, including one rendered as an MCP App inside the client. **Coming next:** shared,
persisted boards (INC-01), state gated links (INC-02), an agent working on real board state
(INC-03), live data from capability services (INC-04), pinned answers (INC-05), and capability
manifests, MCP capabilities, A2A, and channels after that.

See [`docs/README.md`](docs/README.md) for the documentation index and
[`docs/plan/armature-plan.md`](docs/plan/armature-plan.md) for the full architecture.

## Repository layout

```text
armature/
  backend/          armature-ms (Maven, Spring Boot)
  web/
    packages/       core, elements (framework free; arrive in INC-00c / INC-04)
    hosts/          angular (reference UI today), react (in progress)
  contracts/        lifecycles, schemas, link relations (arrive from INC-01 onward)
  capabilities/     mock capability services (arrive from INC-04 onward)
  docs/             plan, principles, ADRs, increment reports, architecture (C4), help
  .work/specs/      per-increment specs
```

## Running each stack

### Backend (`backend/`)

```bash
cd backend
./mvnw spring-boot:run
```

Runs on `http://localhost:8080`. Defaults to a local Ollama model with no API key required; see
[`backend/README.md`](backend/README.md) for model provider options, API docs (Swagger UI at
`/swagger-ui.html`), and the MCP/AG-UI/A2A protocol surface.

Tests: `cd backend && ./mvnw -q test`

### Angular host (`web/hosts/angular/`)

```bash
cd web/hosts/angular
npm ci
npm start
```

Runs on `http://localhost:4200` and talks to the backend at `http://localhost:8080` (see
`src/environments/environment.ts`). The UI is fully self-contained (boards persist to
`localStorage`); the backend is optional unless you want the agentic assistant.

Build: `npx ng build` &nbsp;&middot;&nbsp; Tests: `npx ng test --watch=false --browsers=ChromeHeadless`

### React host (`web/hosts/react/`)

```bash
cd web/hosts/react
npm ci
npm run dev
```

An in-progress port of the Angular host to React; see
[`web/hosts/react/PORTING_STATUS.md`](web/hosts/react/PORTING_STATUS.md) for what's done.

Build: `npm run build`

### Diagrams (`docs/architecture/`)

```bash
docs/architecture/render.sh      # render every docs/**/*.puml to SVG (needs Java 17+)
docs/architecture/check-svg.sh   # fail if a committed SVG is stale (what CI runs)
```

CI runs one workflow per stack (`.github/workflows/`), each only when that stack's files change.

## History

This repository was scaffolded in INC-00a by copying the working trees of three existing
repositories, without their git history. Their commit history lives on in the originals:

- [armature-ms](https://github.com/jayhamilton/armature-ms) &rarr; `backend/`
- [armature-ui](https://github.com/jayhamilton/armature-ui) &rarr; `web/hosts/angular/`
- [armature-ui-react](https://github.com/jayhamilton/armature-ui-react) &rarr; `web/hosts/react/`

See [`docs/adr/0002-monorepo-fresh-history.md`](docs/adr/0002-monorepo-fresh-history.md) for why.
