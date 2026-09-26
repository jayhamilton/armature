# INC-00b: Documentation, contracts, and CI

## Goal and vision link

Give the monorepo its documentation backbone and its safety net: principles and an ADR for every
decision the plan has already made, C4 diagrams that render from source, CI for every stack, a
check that fails on stale diagrams, and a dependency audit. Like INC-00a, this serves all four
outcomes indirectly and none directly: no runtime behavior changed. It makes the architecture
reviewable through reports and diagrams rather than diffs (guardrail 7), which every later
increment depends on.

## What was built

- **Docs skeleton:** [`docs/README.md`](../README.md) (index), [`docs/principles.md`](../principles.md),
  and a README in each planned directory (`architecture/{c4,sequences,state,modules}`, `api`,
  `extension`, `patterns`, `security`, `help`, `site`) saying what it will hold and which
  increment fills it.
- **Placeholders:** [`contracts/README.md`](../../contracts/README.md) and
  [`capabilities/README.md`](../../capabilities/README.md) replace the `.gitkeep` files and state
  each directory's boundary rule.
- **ADRs 0003 to 0014** in [`docs/adr/`](../adr/), MADR format, one per decision the plan records.
- **Diagram tooling:** [`docs/architecture/render.sh`](../architecture/render.sh) and
  [`check-svg.sh`](../architecture/check-svg.sh), sharing
  [`plantuml.sh`](../architecture/plantuml.sh), which pins PlantUML 1.2026.8 by SHA-256 and caches
  it in `.cache/plantuml/` (now in `.gitignore`). C4-PlantUML comes from PlantUML's bundled
  standard library, and layout uses Smetana, so neither Graphviz nor network includes are needed.
- **CI** in `.github/workflows/`, each filtered to its own paths:
  `backend.yml` (new; Temurin Java 25, `./mvnw -q test`), `react.yml` (new; Node 24, `npm ci`,
  `npm run build`), `docs.yml` (new; Java 25, `check-svg.sh`), and `angular.yml` (edited: Node 20
  to Node 24, since Angular 22's engines field requires `^22.22.3 || ^24.15.0 || >=26`, so the
  workflow as committed in INC-00a would have failed on GitHub).
- **Dependency audit:** [`docs/architecture/dependency-audit.md`](../architecture/dependency-audit.md)
  gives all direct dependencies of the backend and both hosts, plus CI tools, a verdict, with
  registry evidence and a follow up table.
- **Angular host fixes** carried from INC-00a:
  - `ace-editor-builds` removed from `package.json` and `package-lock.json` (not imported anywhere).
  - `angular.json`: `initial` budget `maximumError` raised from `2mb` to `2.5mb`. The bundle is
    2.24 MB both before and after the removal; the audit schedules the return to 2 MB for INC-04.
  - `app.component.spec.ts`: "should render title" asserted CLI boilerplate the template no longer
    has; it is now "should render the router outlet", matching the actual template.
  - `area-chart.component.spec.ts`: added `provideNoopAnimations()`, which ngx-charts needs and
    the app provides in `app.config.ts`. This fixed `NG05105`.
- **Skills:** [`armature-document-increment`](../../.claude/skills/armature-document-increment/SKILL.md)
  and [`armature-architecture-review`](../../.claude/skills/armature-architecture-review/SKILL.md).
- **Root README:** links the docs index and documents the diagram commands.

## Diagrams changed

| File | View |
| --- | --- |
| [`docs/architecture/c4/context.puml`](../architecture/c4/context.puml) (`.svg`) | System context, current |
| [`docs/architecture/c4/container-current.puml`](../architecture/c4/container-current.puml) (`.svg`) | Containers, current: `backend/`, Angular host, React host, browser `localStorage` |
| [`docs/architecture/c4/container-target.puml`](../architecture/c4/container-target.puml) (`.svg`) | Containers, target (the plan's "Target architecture" view) |

## Decisions

| ADR | Decision |
| --- | --- |
| [0003](../adr/0003-postgresql-spring-data-jdbc.md) | PostgreSQL through Spring Data JDBC |
| [0004](../adr/0004-plain-hal-state-gated-links.md) | Plain HAL with state gated links |
| [0005](../adr/0005-dependency-policy.md) | Dependency policy |
| [0006](../adr/0006-state-pattern-lifecycles.md) | State pattern lifecycles, XState in the UI |
| [0007](../adr/0007-tmf630-in-house.md) | TMF 630 implemented in house |
| [0008](../adr/0008-spring-modulith-in-process-events.md) | Spring Modulith, in process events, Kafka deferred |
| [0009](../adr/0009-sse-not-websockets.md) | SSE, not WebSockets |
| [0010](../adr/0010-local-first-ui.md) | Local first UI with background sync |
| [0011](../adr/0011-own-oidc-issuer.md) | Armature's own OIDC issuer |
| [0012](../adr/0012-capability-manifests.md) | Capability manifests modeled on VS Code |
| [0013](../adr/0013-diagrams-as-code.md) | Diagrams as code with a stale SVG check |
| [0014](../adr/0014-docusaurus-user-guide.md) | Docusaurus user guide |

The numbering keeps the two numbers the plan already cites (0003, 0005).

## Evidence

No application tests were added (behavior is unchanged). Every workflow's commands were run
locally on macOS with JDK 25.0.2 and Node 24.18.1.

| Check | Command | Result |
| --- | --- | --- |
| Backend | `cd backend && ./mvnw -q test` | **Pass**: 5 test classes, 36 tests, 0 failures, 0 errors |
| Angular install | `cd web/hosts/angular && npm ci` | **Pass** (from the updated lock file) |
| Angular build | `npx ng build` | **Pass**: initial total 2.24 MB, under the 2.5 MB error budget (warnings remain for the 500 kB warning budget and two component stylesheets, unchanged from INC-00a) |
| Angular tests | `npx ng test --watch=false --browsers=ChromeHeadless` | **Pass**: 26 of 26 (was 24 of 26) |
| React | `cd web/hosts/react && npm ci && npm run build` | **Pass** (one chunk size warning, unchanged) |
| Diagrams | `docs/architecture/check-svg.sh` | **Pass**: all 3 diagrams up to date |
| Stale detection | Edited a relation label in `context.puml` without re-rendering, ran the check | **Fails as intended**: `STALE docs/architecture/c4/context.svg`, exit 1 (then restored) |
| Orphan detection | Copied an SVG to a path with no `.puml`, ran the check | **Fails as intended**: `ORPHAN docs/architecture/orphan.svg`, exit 1 (then removed) |
| Workflow syntax | Parsed all four workflow files as YAML | **Pass** |

## Not done and why

- **CI has not run on GitHub.** The branch is not pushed (CLAUDE.md: never push unless asked).
  Each workflow's commands pass locally, but "CI green" is only confirmed once the branch is
  pushed and the four workflows run on Ubuntu. The first run will also download PlantUML there.
- **Application modules and web layers diagrams** are not drawn, although the plan says they are
  "recreated in INC-00b". As agreed at spec approval, they move to INC-00c, where the modules and
  `web/packages/core` they depict are built; drawing them now would break the plan's rule that
  every element maps to real code. The plan text still says INC-00b and should be updated to
  match.
- **ADRs deliberately left for later**, as the plan's own increment entries assign them: RFC 9457
  over the TMF error object and problem `type` URIs (INC-01), and the custom element gadget
  contract (INC-00c). The schema.org ontology is not marked "decided" in the plan, so it has no
  ADR.
- **Only `ace-editor-builds` was removed.** The audit marks further Remove, Retire, and Watch items
  (for example unused `json-path` and `spring-restdocs-mockmvc`, deprecated `@types/dompurify`,
  the Karma test stack, springdoc on its Boot 3 line); each is scheduled in the audit's follow up
  table rather than changed here.
- **Angular budget** is raised, not solved: the real fix is retiring ngx-charts in INC-04.
- **Size:** about 1,570 changed lines excluding SVG and `package-lock.json`, slightly over the
  plan's 1,500 line guideline. Almost all of it is documentation (twelve ADRs, the audit, skills);
  scripts, workflows, and Angular changes are about 220 lines.
- **Skills not yet exercised by the harness:** both skills were written in this session, so this
  report followed `armature-document-increment`'s steps by hand. Their first automatic use is
  INC-00c.

## Next increment's entry criteria

INC-00c (Modules and reference patterns) can start once this report is reviewed, the branch is
merged, and the four workflows have run green on GitHub. INC-00c should also pick up:

- The application modules and web layers C4-PlantUML diagrams deferred from this increment.
- The ADR for the custom element gadget contract (already in INC-00c's plan entry).
- The audit's INC-00c follow ups: remove `json-path`, `spring-restdocs-mockmvc`,
  `schematics-scss-migrate`, and `@types/dompurify`; confirm `node-forge`; align `@types/node`;
  choose the unit test runner that replaces Karma.
