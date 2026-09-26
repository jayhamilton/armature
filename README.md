# Armature

Armature is a runtime for interfaces that are described rather than built: a customer's answers
are assembled, kept, and delivered anywhere, and every capability arrives as a declared,
discoverable extension rather than hand wired code. Boards and gadgets are data, not code; adding
a service is a manifest, the way a VS Code extension contributes to the editor, not a new portal.
See [`docs/plan/armature-plan.md`](docs/plan/armature-plan.md) for the full architecture and
[`ROADMAP.md`](ROADMAP.md) for the increment plan.

## Repository layout

```text
armature-platform/
  backend/          armature-ms (Maven, Spring Boot)
  web/
    packages/       core, elements (framework free; arrive in INC-00c / INC-04)
    hosts/          angular (reference UI today), react (in progress)
  contracts/        lifecycles, schemas, link relations (arrive from INC-01 onward)
  capabilities/     mock capability services (arrive from INC-04 onward)
  docs/             plan, ADRs, increment reports, architecture, help
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

## History

This repository was scaffolded in INC-00a by copying the working trees of three existing
repositories, without their git history. Their commit history lives on in the originals:

- [armature-ms](https://github.com/jayhamilton/armature-ms) &rarr; `backend/`
- [armature-ui](https://github.com/jayhamilton/armature-ui) &rarr; `web/hosts/angular/`
- [armature-ui-react](https://github.com/jayhamilton/armature-ui-react) &rarr; `web/hosts/react/`

See [`docs/adr/0002-monorepo-fresh-history.md`](docs/adr/0002-monorepo-fresh-history.md) for why.
