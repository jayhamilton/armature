# SPEC-INC-00b: Documentation, contracts, and CI

## Goal

Give the monorepo its documentation backbone and its safety net: a `docs/` skeleton with the
principles and an ADR for every decision the plan has already made, C4-PlantUML diagrams of the
current system that render from source, CI that builds and tests every stack only when that stack
changes, a check that fails when a committed SVG is stale, and a dependency audit that gives every
direct dependency a policy verdict (removing `ace-editor-builds`).

## Vision outcome served

All four outcomes, indirectly (per the plan's increment table, 00a to 00c serve "All"). This
increment changes no runtime behavior. It makes the architecture visible and checkable so every
later increment can be reviewed against the vision through its report and diagrams rather than
its diff (guardrail 7), and it puts in place the stale SVG check that `armature-document-increment`
depends on.

## Scope

### 1. `docs/` skeleton

Following the plan's repository layout. Each new directory gets a short `README.md` that opens with
one paragraph on how it serves the vision, then says which increment fills it.

- `docs/README.md`: index of the documentation tree.
- `docs/principles.md`: the six architectural principles, summarized from the plan with links back
  to the plan sections (the plan stays the source of truth; this page does not restate detail).
- `docs/architecture/README.md`, `docs/architecture/c4/` (filled here),
  `docs/architecture/sequences/`, `docs/architecture/state/`, `docs/architecture/modules/`
  (stub READMEs; filled from INC-00c onward).
- Stub READMEs for `docs/api/`, `docs/extension/`, `docs/patterns/`, `docs/security/`,
  `docs/help/` (with `gadgets/`, `problems/`, `tasks/`, `concepts/` named but not created),
  `docs/site/`.
- `docs/plan/` stays where it is.

### 2. `contracts/` and `capabilities/` placeholders

Replace each `.gitkeep` with a `README.md` stating the directory's purpose and its boundary rule
(capabilities may import only `contracts/`; contracts are read by every stack), and which
increment first adds content.

### 3. ADR-0003 to ADR-0014 (MADR, `docs/adr/`)

Numbering keeps the two numbers the plan already cites (ADR-0003 persistence, ADR-0005 dependency
policy). Each ADR records the decision, the options the plan considered, and consequences, and
links to its plan section.

| ADR | Decision |
| --- | --- |
| 0003 | Persistence: PostgreSQL through Spring Data JDBC, JSONB for gadget defined data, Flyway, in memory adapter for demos |
| 0004 | Hypermedia: plain HAL with state gated links, link relation catalog, `arm:` CURIEs |
| 0005 | Dependency policy (the criteria and the verdict table) |
| 0006 | Lifecycles: hand written State pattern behind `LifecycleEngine`; Spring Statemachine rejected; XState for UI flows; JSON definition as the single source |
| 0007 | TMF 630 conventions implemented in house in a `tmf` module; tmf630-toolkit used only as a reference |
| 0008 | Backend modularity: Spring Modulith application modules, jMolecules roles, in process events with the JDBC publication registry; Kafka deferred |
| 0009 | Real time: SSE, one stream per client; no WebSockets |
| 0010 | Local first UI: IndexedDB store, JSON Patch outbox, `If-Match`/`ETag` sync, conflicts as problems |
| 0011 | Identity: Armature's own OIDC issuer (Spring Security 7 authorization server); roles and permissions in PostgreSQL behind `ActorResolver` and `AccessPolicy` |
| 0012 | Extension model: capability manifests modeled on the VS Code extension manifest |
| 0013 | Diagrams as code: C4-PlantUML and PlantUML with committed SVGs and a stale check in CI |
| 0014 | User guide: Docusaurus over `docs/help`, published to GitHub Pages |

**Deliberately not in this range**, because the plan assigns them to a later increment:
RFC 9457 over the TMF error object and the problem `type` URI rule (INC-01 lists this ADR), and
the custom element gadget contract (INC-00c lists this ADR). The schema.org ontology is not
marked "decided" in the plan, so it gets no ADR yet.

### 4. C4 diagrams (C4-PlantUML, `docs/architecture/c4/`)

- `context.puml`: the current system in context: customer (browser), Armature, model providers
  (Ollama, Anthropic), MCP clients, A2A peers (inactive today).
- `container-current.puml`: the containers that exist today: `backend` (Spring Boot, with its
  REST, MCP server, AG-UI SSE, and A2A surfaces), the Angular host, the React host, the browser
  `localStorage`, the model providers.
- `container-target.puml`: the plan's target container view (four facades over one domain layer,
  capability registry), which the plan says is recreated in INC-00b.
- A rendered `.svg` committed next to each `.puml`.

**Not drawn here** (plan inconsistency, flagged for your call): the plan also says the
*application modules* and *web layers* diagrams are "recreated in INC-00b". Those depict structure
that does not exist until INC-00c (Modulith modules, `web/packages/core`). I propose drawing them
in INC-00c alongside the code they describe, so every element maps to a real package (the plan's
own diagram rule). If you would rather have them now as target views, they add two `.puml` files.

### 5. Rendering and the stale SVG check

- `docs/architecture/render.sh`: downloads a pinned PlantUML jar (checksum verified) into an
  ignored cache directory and renders every `docs/**/*.puml` to SVG. C4-PlantUML comes from the
  standard library bundled in PlantUML (`!include <C4/C4_Container>`), so rendering needs no
  network beyond the jar. Layout uses PlantUML's built in Smetana engine, so no Graphviz install.
- `docs/architecture/check-svg.sh`: the stale check. PlantUML embeds the encoded diagram source in
  each SVG (`<?plantuml-src ...?>`). The check re-renders and compares that embedded source,
  not the drawn geometry, so it fails when a `.puml` changed without re-rendering but does not
  flap on font metric differences between macOS and the Linux runner. It also fails if a `.puml`
  has no `.svg` or an `.svg` has no `.puml`.

### 6. CI (`.github/workflows/`), path filtered per stack

| Workflow | Triggers on | Steps |
| --- | --- | --- |
| `backend.yml` (new) | `backend/**`, itself | Temurin **Java 25** via `actions/setup-java` (pinned, as the INC-00a report asked), Maven cache, `./mvnw -q test` |
| `angular.yml` (edit) | `web/hosts/angular/**`, itself | Node **24** (the current file uses Node 20, which Angular 22 does not support: its engines field is `^22.22.3 \|\| ^24.15.0 \|\| >=26`), `npm ci`, `ng build`, `ng test` headless |
| `react.yml` (new) | `web/hosts/react/**`, itself | Node 24, `npm ci`, `npm run build` |
| `docs.yml` (new) | `docs/**`, itself | Java 25, `check-svg.sh` |

All run on `push` and `pull_request`. "CI green" is verified locally in this increment by running
each workflow's exact commands; the report will say that confirming green on GitHub needs the
branch pushed, which I will not do unless asked.

### 7. Angular build budget and the two failing tests (carried from INC-00a)

Proposed resolution, so that `angular.yml` can be green:

- **Build budget:** raise the `initial` `maximumError` in `angular.json` from `2mb` to `2.5mb`
  (current bundle 2.24 MB), with a comment in the dependency audit that the budget returns to
  `2mb` when ngx-charts retires in INC-04. Removing `ace-editor-builds` may shrink the bundle;
  the new budget is set from the measured size after that removal.
- **`AppComponent should render title`:** the test asserts CLI boilerplate the template no longer
  renders. Replace the assertion with one against what `AppComponent` actually renders (test fix
  only; no template change).
- **`AreaChartComponent should create` (`NG05105`):** the test module lacks an animations
  provider that ngx-charts needs. Add `provideNoopAnimations()` to that spec's `TestBed` (test fix
  only). If that does not resolve it, mark it pending with a reference to INC-04, and say so in
  the report.

### 8. Dependency audit

- `docs/architecture/dependency-audit.md`: every **direct** dependency in `backend/pom.xml`,
  `web/hosts/angular/package.json`, and `web/hosts/react/package.json`, plus the GitHub Actions
  and build tools used by CI, each with a verdict (Keep, Watch, Retire, Remove) against the
  ADR-0005 criteria and a one line reason. Transitive dependencies are out of scope.
- **Remove `ace-editor-builds`** from the Angular host (`package.json` and `package-lock.json`).
  It is not imported anywhere in `src/` or `angular.json`; `ace-builds` stays.
- Other findings (for example `json-path 2.4.0` being old, springdoc's Boot 4 line) are recorded
  as Watch with a follow up increment, **not changed** here.

### 9. Skills (`.claude/skills/`)

- `armature-document-increment/SKILL.md`: writes `docs/increments/INC-nn.md` from the plan's
  template, lists changed diagrams, stubs ADRs; ends by running `check-svg.sh` and refusing
  "done" if it fails. It references the plan and `docs/` rather than restating rules.
- `armature-architecture-review/SKILL.md`: reviews a branch against `docs/principles.md`, the
  port catalog, and CLAUDE.md's architecture rules (no `switch`/`instanceof` on type, no rule in a
  facade, no link without a state rule, dependencies point inward, dependency policy). Checks that
  are not yet executable (ArchUnit arrives in INC-00c) are listed as manual review items.

### 10. Report

`docs/increments/INC-00b.md` from the plan's template (written with the new
`armature-document-increment` skill, as its first real use).

## Out of scope

- The application modules and web layers diagrams (see section 4), component views, sequences,
  state diagrams.
- Spring Modulith restructuring, jMolecules, `@DesignPattern`, `LifecycleEngine`, `web/packages/core`
  (INC-00c).
- Docusaurus site setup and GitHub Pages publishing (ADR only here; site build arrives with the
  help catalog in INC-01).
- dependency-cruiser and ArchUnit rules (no `web/packages` or modules to enforce yet).
- Upgrading or replacing any dependency other than removing `ace-editor-builds`.
- Pushing the branch, opening a PR, or renaming the repository.
- Any application behavior change.

## Files and modules touched

- New: `docs/README.md`, `docs/principles.md`, `docs/adr/0003-*.md` to `docs/adr/0014-*.md`,
  `docs/architecture/{README.md,render.sh,check-svg.sh,dependency-audit.md}`,
  `docs/architecture/c4/{context,container-current,container-target}.{puml,svg}`,
  stub `README.md` files in `docs/architecture/{sequences,state,modules}`, `docs/api`,
  `docs/extension`, `docs/patterns`, `docs/security`, `docs/help`, `docs/site`,
  `contracts/README.md`, `capabilities/README.md`, `.github/workflows/{backend,react,docs}.yml`,
  `.claude/skills/armature-document-increment/SKILL.md`,
  `.claude/skills/armature-architecture-review/SKILL.md`, `docs/increments/INC-00b.md`.
- Edited: `.github/workflows/angular.yml`, `web/hosts/angular/package.json`,
  `web/hosts/angular/package-lock.json`, `web/hosts/angular/angular.json` (budget),
  `web/hosts/angular/src/app/app.component.spec.ts`,
  `web/hosts/angular/src/app/gadgets/area-chart/*.spec.ts`, root `.gitignore` (PlantUML jar cache),
  `README.md` (link to `docs/`).
- Removed: `contracts/.gitkeep`, `capabilities/.gitkeep`.
- Not touched: `docs/plan/armature-plan.md`, `CLAUDE.md`, backend source, React host.

## Tests and checks

| Check | Command | Expected |
| --- | --- | --- |
| Backend | `cd backend && ./mvnw -q test` (JDK 25) | Pass, 36 tests (unchanged) |
| Angular build | `cd web/hosts/angular && npm ci && npx ng build` | Pass (after budget change) |
| Angular tests | `npx ng test --watch=false --browsers=ChromeHeadless` | 26 of 26 pass |
| React build | `cd web/hosts/react && npm ci && npm run build` | Pass |
| Diagrams | `docs/architecture/render.sh` then `docs/architecture/check-svg.sh` | Pass; then edit a `.puml` without re-rendering and confirm the check fails (recorded in the report) |
| Workflow syntax | Each workflow parses as valid YAML | Pass |

No new application tests (behavior is unchanged).

## Docs to update

Everything in section 1, 3, 4, 8, 9, and 10 is documentation; plus the root `README.md` link to
`docs/`. The plan is not edited; the diagram inconsistency in section 4 is reported instead.

## Size

Estimated roughly 1,200 to 1,500 changed lines excluding SVG and `package-lock.json`, close to the
plan's 1,500 line guideline because of the twelve ADRs. If it runs over, the split point is the
ADRs (0009 to 0014 could move to INC-00c).

## Decisions to confirm before I build

1. **Diagrams:** draw the modules and web layers diagrams in INC-00c, not here (section 4).
2. **Angular:** raise the budget and fix the two tests as in section 7, rather than leave CI red.
3. **ADR set:** the twelve in section 3, with RFC 9457 and the gadget contract left to INC-01 and
   INC-00c as the plan's own increment entries say.
