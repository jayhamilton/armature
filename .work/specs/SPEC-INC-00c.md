# SPEC-INC-00c: Modules and reference patterns

## Goal

Give the backend verified internal boundaries and the codebase its teaching backbone: restructure
`backend/` into Spring Modulith application modules with a verification test and generated module
diagrams, mark hexagonal roles with jMolecules, add the `@DesignPattern` and `@SolidPrinciple`
annotations with a `PatternCatalogTest` that generates the pattern catalog, implement
`LifecycleEngine` and the board lifecycle as the State pattern reference, and start
`web/packages/core` with a Strategy registry keyed by `@type`. Record the custom element gadget
contract in an ADR.

## Vision outcome served

All four, indirectly (the plan's increment table lists 00a to 00c as "All"). No runtime behavior
changes for users. The board lifecycle is the foundation of "No assumptions" (INC-02 exposes it
as state gated links), and the `@type` registry is the seam "Consolidation" plugs into (INC-04,
INC-06). Verified modules keep consolidation from becoming a new monolith.

## Scope

### 1. Backend dependencies (all listed Keep in the dependency policy)

- Spring Modulith BOM **2.1.1** (Boot 4.1 line): `spring-modulith-starter-core`,
  `spring-modulith-starter-test` (test), `spring-modulith-docs` (test, for the Documenter).
- jMolecules BOM **2025.0.2**: `jmolecules-hexagonal-architecture`, `jmolecules-ddd`, and
  `jmolecules-archunit` (test). ArchUnit comes with Spring Modulith's test starter.
- **Removed** (INC-00b audit follow ups): `json-path` 2.4.0 and `spring-restdocs-mockmvc`, both
  unused in `src/`.

### 2. Application modules

A module is a direct subpackage of `com.addf.backend.armature`. Current packages already line up
with modules, so this is mostly verification plus two new modules, not a large move:

| Module | Contents | Allowed dependencies |
| --- | --- | --- |
| `agent` | Agent chat, AG-UI (`agent.agui` becomes internal to the module), tools, board snapshots | `config` |
| `mcpapp` | MCP Apps (`BoardSummaryApp`, `ChartsApp`) | `agent` (uses `BoardSnapshotStore`, `BoardSnapshot`, `BoardGadgetEntry`, which stay in `agent`'s API package) |
| `datasource` | `EndpointController`, `EndpointStore` (SPEC-73 start) | none |
| `config` | CORS and OpenAPI configuration | none |
| `lifecycle` (new) | The `LifecycleEngine` port and `TransitionNotAllowedException` | `patterns` |
| `board` (new) | `BoardState` hierarchy, `BoardEvent`, `BoardLifecycle` | `lifecycle`, `patterns` |
| `patterns` (new, open module) | `@DesignPattern`, `@SolidPrinciple`, `Pattern`, `Principle` | none |

- Each module gets a `package-info.java` with `@ApplicationModule(allowedDependencies = ...)`,
  so every arrow in the module diagram is a line of code a reviewer sees.
- `HelloController` stays in the root package (Modulith ignores it).
- If `verify()` finds a violation I have not predicted here, I will fix it by moving a type or
  declaring a named interface, and list each such change in the report. I will stop and ask if a
  fix would change behavior.

### 3. Verification and documentation tests (`backend/src/test`)

- `ModularityTest`: `ApplicationModules.of(ArmatureApplication.class).verify()`, plus the
  jMolecules hexagonal ArchUnit rules.
- `ModuleDocumentationTest`: runs the Modulith `Documenter` and writes the C4-PlantUML module
  diagram and one component diagram per module to `docs/architecture/modules/`. The SVGs are
  rendered with `docs/architecture/render.sh`, so the INC-00b stale check covers them.
- Hexagonal roles marked with jMolecules on existing code: `AgentController`,
  `EndpointController`, `BoardSummaryApp`, `ChartsApp` as `@PrimaryAdapter`; `LifecycleEngine` as
  `@Port`. No other behavior changes to existing classes.

### 4. Pattern annotations and the generated catalog

- `patterns` module: `@DesignPattern(pattern, role, doc)`, `@SolidPrinciple(value, note)`, and
  the `Pattern` and `Principle` enums, exactly as shown in the plan's "Marking patterns in code".
- `PatternCatalogTest` (ArchUnit class import, no new dependency):
  - generates the Java section of `docs/patterns/index.md` (each pattern, every class in each
    role, linked to source) and **fails if the committed section differs**, printing the command
    to regenerate it (`./mvnw test -Dtest=PatternCatalogTest -Dpatterns.write=true`);
  - fails if an annotation's `doc` points to a missing page;
  - fails if a pattern page links a Java source file that no longer exists.
- The TypeScript section of the same file is owned by a script in `web/packages/core` (section 6),
  so each stack's CI checks its own half. The two halves sit between marker comments.

### 5. `LifecycleEngine` and the board lifecycle (State pattern reference)

- `lifecycle.LifecycleEngine<S, E>`: `initialState()`, `allowedEvents(S)`, `fire(S, E)`. A port
  because four lifecycles are scheduled (board, capability, pinned answer, composition task).
- `board.BoardState`: a sealed interface with records `Draft`, `Published`, `Locked`, `Archived`.
  Each state overrides only the transitions it allows; the interface's defaults refuse the rest
  with `TransitionNotAllowedException`. No `switch` or `instanceof` on state anywhere.
- `board.BoardEvent`: enum whose constants carry a method reference to the state operation, so
  firing an event needs no `switch`.
- `board.BoardLifecycle implements LifecycleEngine<BoardState, BoardEvent>`, a Spring bean.
- Proposed transitions (for your confirmation, see "Decisions"):

| From | Event | To |
| --- | --- | --- |
| `DRAFT` (initial) | `PUBLISH` | `PUBLISHED` |
| `DRAFT` | `DISCARD` | `ARCHIVED` |
| `PUBLISHED` | `LOCK` | `LOCKED` |
| `PUBLISHED` | `ARCHIVE` | `ARCHIVED` |
| `LOCKED` | `UNLOCK` | `PUBLISHED` |
| `ARCHIVED` | none (terminal) | |

  `share` and `subscribe`, which the plan lists as `PUBLISHED` links, are actions allowed in a
  state, not transitions; they become link rules in INC-02.
- `BoardLifecycleTest`: every state and event pair (4 by 6 = 24 cases), asserting the target
  state for allowed pairs and `TransitionNotAllowedException` for the rest, and that
  `allowedEvents` agrees with what `fire` accepts.
- Every state class, the interface, the engine, and the port carry `@DesignPattern` (State:
  Context, State, ConcreteState) and `@SolidPrinciple(OPEN_CLOSED)` with Javadoc headings
  Pattern, Principle, Why here, How to extend, See also.
- Not wired to any endpoint yet: there is no board resource until INC-01, and links arrive in
  INC-02. The JSON lifecycle definition in `contracts/` and the conformance test against it are
  INC-02 scope.

### 6. `web/packages/core` (initial)

- `@armature/core` package: TypeScript, ES modules, built with `tsc` (TypeScript is already a
  dependency of both hosts). **No new dependencies.** Tests use Node's built in `node:test` runner
  on the compiled output.
- `TypeRegistry<T>`: the framework free Strategy registry keyed by `@type` (register, resolve,
  has, types; registering a type twice throws; resolving an unknown type returns a clear error
  result). This is the seam the gadget registry, data sources, and channel renderers use later,
  generalizing today's `gadget-registry.ts`.
- TSDoc tags `@pattern`, `@role`, `@principle` declared in `web/packages/core/tsdoc.json`.
- `scripts/pattern-catalog.mjs`: scans `web/packages/*/src` for those tags, writes or checks the
  TypeScript section of `docs/patterns/index.md` (`npm run catalog` and `npm run catalog:check`).
- Tests for `TypeRegistry`.
- CI: `.github/workflows/web-core.yml`, path filtered on `web/packages/core/**` and
  `docs/patterns/**`: `npm ci`, build, test, `catalog:check`.
- `web/packages/README.md` updated. Hosts do **not** consume core yet (that migration is INC-04).

### 7. Documentation

- `docs/patterns/state.md` from the plan's pattern page template (intent, the problem in Armature,
  participants linked to source, PlantUML class diagram, SOLID callout, tests, exercise: add a
  `RESTORED` state).
- `docs/patterns/strategy-registry.md`, the same template, for `TypeRegistry`.
- `docs/patterns/index.md`: generated catalog (State and Strategy registry, as the plan's expected
  outcome requires).
- `docs/architecture/modules/`: Documenter output plus rendered SVGs (the "application modules"
  diagram deferred from INC-00b).
- `docs/architecture/c4/web-layers-target.puml` and `.svg`: the plan's web layers view (five hosts
  over elements and core), labeled a target view like `container-target`, because `elements` and
  three of the hosts do not exist yet. The C4 README gains its row.
- `docs/adr/0015-custom-element-gadget-contract.md`: gadgets are custom elements registered by
  `@type`; inputs are properties, outputs are DOM events, theming is CSS custom properties and
  `::part` (plan, "The gadget contract is a custom element").
- `docs/architecture/dependency-audit.md`: new dependencies added with verdicts; removed ones
  marked; follow up table updated.
- `docs/plan/armature-plan.md`: **one correction only**, changing the two "recreated here as
  C4-PlantUML in INC-00b" notes (modules, web layers) to INC-00c, as flagged in the INC-00b
  report. I will not edit anything else in the plan.
- `docs/increments/INC-00c.md`, written with the `armature-document-increment` skill, including
  the plan's new "Patterns introduced" line.

### 8. Small carried items

- Angular host audit follow ups: remove `schematics-scss-migrate` and `node-forge` (no package
  depends on `node-forge`; `npm ls` shows only the direct entry), and move `@types/node` from
  `^12.11.1` to `^24` to match CI's Node 24. Build and tests must stay green.
- React host: remove the deprecated `@types/dompurify` stub.
- Repository rename leftovers: `web/hosts/angular/.agent-pipeline.json` `repo` field to
  `jayhamilton/armature`.

## Out of scope

- Replacing Karma in the Angular host. It needs a new test runner dependency (Angular 22 defaults
  to Vitest, which the policy table does not list) and touches every spec; proposed for INC-04,
  when the Angular host moves onto `@armature/elements`.
- Wiring the board lifecycle to REST, HAL links, events, the JSON lifecycle definition, or XState
  (INC-01, INC-02).
- `@armature/elements`, Lit, dependency-cruiser rules, hosts consuming core (INC-04).
- Annotating the Angular `EventService` as the Mediator example (the plan lists it; it needs the
  TSDoc scanner to read host code, which waits until hosts use core).
- Spring Modulith observability and the actuator `modulith` endpoint (runtime concerns for later).
- springdoc and Jackson upgrades (INC-01 per the audit).

## Files and modules touched

- Backend new: `package-info.java` in `agent`, `mcpapp`, `datasource`, `config`, `lifecycle`,
  `board`, `patterns`; `lifecycle/{LifecycleEngine,TransitionNotAllowedException}.java`;
  `board/{BoardState,BoardEvent,BoardLifecycle}.java` (states as nested records or separate
  files); `patterns/{DesignPattern,SolidPrinciple,Pattern,Principle}.java`; tests
  `ModularityTest`, `ModuleDocumentationTest`, `PatternCatalogTest`, `BoardLifecycleTest`.
- Backend edited: `pom.xml`; jMolecules annotations on `AgentController`, `EndpointController`,
  `BoardSummaryApp`, `ChartsApp`; any type moves `verify()` demands (listed in the report).
- Web new: `web/packages/core/**`, `.github/workflows/web-core.yml`.
- Web edited: Angular `package.json`, `package-lock.json`, `.agent-pipeline.json`; React
  `package.json`, `package-lock.json`; `web/packages/README.md`.
- Docs new: `docs/patterns/{index,state,strategy-registry}.md` (plus the State class diagram
  `.puml` and `.svg`), `docs/architecture/modules/*`, `docs/architecture/c4/web-layers-target.*`,
  `docs/adr/0015-*.md`, `docs/increments/INC-00c.md`.
- Docs edited: `docs/architecture/c4/README.md`, `docs/architecture/modules/README.md`,
  `docs/patterns/README.md`, `docs/architecture/dependency-audit.md`, the two plan notes.

## Tests and checks

| Check | Command | Expected |
| --- | --- | --- |
| Backend | `cd backend && ./mvnw -q test` | Pass: the existing 36 tests plus `ModularityTest`, `ModuleDocumentationTest`, `PatternCatalogTest`, and `BoardLifecycleTest` (24 transition cases) |
| Core | `cd web/packages/core && npm ci && npm run build && npm test && npm run catalog:check` | Pass |
| Angular | `npm ci && npx ng build && npx ng test --watch=false --browsers=ChromeHeadless` | Build passes; 26 of 26 |
| React | `npm ci && npm run build` | Pass |
| Diagrams | `docs/architecture/check-svg.sh` | Pass |
| Negative checks (recorded in the report) | Add a forbidden cross module reference; break a pattern page link; edit the catalog by hand | `verify()` fails; `PatternCatalogTest` fails; `catalog:check` fails |
| GitHub | Push and PR, only when you ask | All workflows green |

## Size

Estimated around 1,500 to 1,800 changed lines excluding generated SVG and lock files, above the
plan's 1,500 line guideline. If you want it smaller, the natural split is to move section 6
(`web/packages/core`, its catalog script, and its workflow) and section 8 into an INC-00d, which
would leave the catalog listing only State after this increment and so miss one half of the plan's
expected outcome until INC-00d.

## Decisions to confirm before I build

1. **Board transitions:** the table in section 5 (notably `DISCARD` of a draft goes to
   `ARCHIVED` rather than deleting, and `ARCHIVED` is terminal).
2. **Module layout:** section 2, keeping existing package names (`agent`, `mcpapp`, `datasource`,
   `config`) rather than renaming them to the plan's future module names now.
3. **Strategy registry in TypeScript:** `TypeRegistry` in `web/packages/core`, tested with
   `node:test` so no new dependency, as the plan's "Strategy registry" catalog entry.
4. **Karma stays until INC-04**; the other audit follow ups are done here.
5. **Size:** keep everything in one increment, or split sections 6 and 8 into an INC-00d.
