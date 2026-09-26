# Armature

**Ask a question. Get back a live interface that answers it.**

Companies ship a separate user experience for every capability they sell. A photographer moves
between Lightroom and Photoshop; a telecom customer checks billing in one portal, configures
services in another, and monitors them in a third. Each product makes sense to the team that
built it, but the customer carries the cost: more logins, more layouts, and the work of joining
the answers themselves. Cognitive load grows with every portal.

Armature turns that around. **Services describe what they offer; the interface is composed on
demand, for the task in front of you.** A person or an agent asks a question, and Armature
assembles a board from the services that can answer it. That board can be refined, pinned, and
reopened later, still live.

Portals are built. Armature boards are composed.

## AI native, not AI added

Agents are first class users of the same system people use, not an assistant bolted onto screens
designed for clicking.

- **Boards are data.** Gadgets are described by schemas, so an agent can build any board a person
  can.
- **The API says what is possible now.** State gated hypermedia links drive both the buttons a
  person sees and the actions an agent takes, so agents follow links instead of needing a tool per
  action.
- **Every client reaches the same boards.** The UI, MCP clients, A2A peers, and channels such as
  Teams share the same resources and permissions; an agent acts as its user, never with more
  access.
- **One manifest extends the UI and the agent.** A service joins with a manifest, modeled on VS
  Code extensions, that contributes gadgets, data sources, commands, and agent tools together.
- **Answers become interfaces.** The assistant answers with a gadget that can be pinned and stays
  bound to its query.

## Where it stands

**Working today:** a board runtime with 11 gadgets (Angular reference UI, React port in progress),
an assistant that edits boards through tool calls on Ollama or Anthropic, and an MCP server with 7
board tools, one rendered as an MCP App. **Next:** shared boards, state gated links, live data from
capability services, pinned answers, then manifests, A2A, and channels
(see [`ROADMAP.md`](ROADMAP.md)).

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
