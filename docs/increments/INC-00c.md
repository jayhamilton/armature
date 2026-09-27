# INC-00c: Modules and reference patterns

## Goal and vision link

Give the backend verified internal boundaries and the codebase its teaching backbone: Spring
Modulith application modules with a verification test and generated diagrams, jMolecules roles,
pattern annotations with a generated catalog, `LifecycleEngine` with the board lifecycle as the
State pattern reference, and the first piece of `web/packages/core`. Like 00a and 00b this serves
all four outcomes indirectly, with no user visible change. The board lifecycle is what INC-02
turns into state gated links (**No assumptions**), the `@type` registry is the seam capabilities
plug into (**Consolidation**), and verified modules keep consolidation from becoming a new
monolith.

## What was built

- **Spring Modulith modules** (Modulith 2.1.1). Each direct subpackage of
  `com.addf.backend.armature` is a module with a `package-info.java` declaring
  `@ApplicationModule(allowedDependencies = ...)`:

  | Module | Allowed dependencies |
  | --- | --- |
  | `agent` (with `agent.agui` internal) | none |
  | `mcpapp` | `agent` |
  | `datasource`, `config` | none |
  | `lifecycle` (new) | `patterns` |
  | `board` (new) | `lifecycle`, `patterns` |
  | `patterns` (new, open) | none |

  No existing type had to move: `verify()` passed on the first run.
- **Architecture tests:** [`ModularityTest`](../../backend/src/test/java/com/addf/backend/armature/ModularityTest.java)
  (`ApplicationModules.verify()` plus jMolecules `ensureHexagonal()`) and
  [`ModuleDocumentationTest`](../../backend/src/test/java/com/addf/backend/armature/ModuleDocumentationTest.java)
  (the Modulith `Documenter` writes C4-PlantUML diagrams and module canvases to
  [`docs/architecture/modules/`](../architecture/modules/README.md), with relationships sorted so
  the output is the same on every run).
- **jMolecules roles:** `@PrimaryAdapter` on `AgentController`, `EndpointController`,
  `BoardSummaryApp`, `ChartsApp`; `@Port` on `LifecycleEngine`.
- **Pattern markers:** [`patterns`](../../backend/src/main/java/com/addf/backend/armature/patterns/)
  module with `@DesignPattern`, `@SolidPrinciple`, `Pattern`, `Principle`, as in the plan.
- **State pattern reference:**
  [`LifecycleEngine`](../../backend/src/main/java/com/addf/backend/armature/lifecycle/LifecycleEngine.java)
  (port), [`BoardState`](../../backend/src/main/java/com/addf/backend/armature/board/BoardState.java)
  (sealed interface; every operation refuses by default), records `Draft`, `Published`, `Locked`,
  `Archived` (each overrides only its transitions), `BoardEvent` (carries the operation it fires,
  so no `switch`), and [`BoardLifecycle`](../../backend/src/main/java/com/addf/backend/armature/board/BoardLifecycle.java).
  Transitions as approved: `DRAFT` to `PUBLISHED` (publish) or `ARCHIVED` (discard); `PUBLISHED`
  to `LOCKED` (lock) or `ARCHIVED` (archive); `LOCKED` to `PUBLISHED` (unlock); `ARCHIVED`
  terminal. Not wired to any endpoint yet.
- **Generated catalog:** [`PatternCatalogTest`](../../backend/src/test/java/com/addf/backend/armature/PatternCatalogTest.java)
  writes and checks the Java half of [`docs/patterns/index.md`](../patterns/index.md), fails on a
  missing page or a pattern page linking a deleted Java file.
- **`web/packages/core`:** [`TypeRegistry`](../../web/packages/core/src/type-registry.ts), the
  Strategy registry keyed by `@type`; tests on `node:test`; TSDoc tags in `tsdoc.json`;
  [`pattern-catalog.mjs`](../../web/packages/core/scripts/pattern-catalog.mjs) writes and checks
  the TypeScript half of the catalog. New workflow `.github/workflows/web-core.yml`.
- **Build as a gate:** removed surefire's `testFailureIgnore` from `backend/pom.xml` (approved
  mid increment), so a failing test now fails the build and CI. `AgentServiceTest` (live Ollama)
  is tagged `live-model` and excluded by default (approved mid increment; see ADR-0016).
- **Rendering:** `docs/architecture/plantuml.sh` now always passes `-Playout=smetana`, so
  generated diagrams, which cannot carry a layout pragma, need no Graphviz either.
- **Audit follow ups:** removed `json-path`, `spring-restdocs-mockmvc` (backend),
  `schematics-scss-migrate`, `node-forge` (Angular), `@types/dompurify` (React); Angular
  `@types/node` from `^12` to `^24`; `.agent-pipeline.json` repo renamed to `jayhamilton/armature`.
- **Docs:** [`state.md`](../patterns/state.md), [`strategy-registry.md`](../patterns/strategy-registry.md),
  pattern and module READMEs, [`web/packages/core/README.md`](../../web/packages/core/README.md),
  `backend/README.md` test notes, and the two plan diagram notes corrected from INC-00b to INC-00c
  (the only plan edit).

## Patterns introduced

| Pattern | Where | Principle |
| --- | --- | --- |
| State | `LifecycleEngine`, `BoardLifecycle`, `BoardState` and its four records | Open/Closed, Dependency inversion |
| Strategy with registry | `TypeRegistry` in `@armature/core` | Open/Closed |

## Diagrams changed

| File | Change |
| --- | --- |
| `docs/architecture/modules/components.puml` and `module-{agent,board,config,datasource,lifecycle,mcpapp,patterns}.puml` (`.svg`, plus `.adoc` canvases) | New, generated by `ModuleDocumentationTest` |
| [`docs/architecture/c4/web-layers-target.puml`](../architecture/c4/web-layers-target.puml) (`.svg`) | New target view: five hosts over elements and core |
| [`docs/patterns/state.puml`](../patterns/state.puml), [`strategy-registry.puml`](../patterns/strategy-registry.puml) (`.svg`) | New class diagrams |
| `docs/architecture/c4/*.svg` | Re-rendered with the Smetana flag; sources unchanged |

Coverage check: every changed backend package appears in the generated module views, and
`web/packages/core` appears in `web-layers-target`. `container-current` still draws the backend
as one container, which remains accurate (one deployable).

## Decisions

- [ADR-0015](../adr/0015-custom-element-gadget-contract.md): gadgets are custom elements
  registered by `@type` (accepted, from the plan).
- [ADR-0016](../adr/0016-test-gating.md): failing tests fail the build; live model tests are opt
  in. **Proposed, needs your review:** stubbed because this increment made the decision without
  one.

## Evidence

Run locally on macOS with JDK 25.0.2 and Node 24.18.1.

| Check | Command | Result |
| --- | --- | --- |
| Backend | `cd backend && ./mvnw test` | **Pass**, exit 0: 59 tests, 0 failures, 0 errors (28 existing tests, which is 36 minus the 8 now opt in, plus `ModularityTest` 2, `ModuleDocumentationTest` 1, `PatternCatalogTest` 3, `BoardLifecycleTest` 25) |
| Backend, live model (opt in) | `./mvnw test -Dgroups=live-model -DexcludedGroups=` with Ollama running | **Fails**: 8 run, 1 failure (`removeGadgetRequestGroundsQueryInProvidedBoardGadgetTitle`; the model paraphrased the title). Failed 2 of 3 isolated reruns. Pre existing, previously hidden by `testFailureIgnore` |
| Core | `cd web/packages/core && npm ci && npm run build && npm test && npm run catalog:check` | **Pass**: 5 of 5 tests; catalog up to date |
| Angular | `npm ci && npx ng build && npx ng test --watch=false --browsers=ChromeHeadless` | **Pass**: build (initial 2.24 MB); 26 of 26 tests |
| React | `npm ci && npm run build` | **Pass** |
| Diagrams | `docs/architecture/check-svg.sh` | **Pass**: 14 diagrams up to date |
| Determinism | `ModuleDocumentationTest` run 3 times | Identical `.puml` output each time |
| Negative: module boundary | Added a `board.BoardState` field to `datasource.EndpointStore` | **Fails as intended**, `mvn` exit 1: "Module 'datasource' depends on module 'board' ... Allowed targets: none." |
| Negative: pattern page link | Pointed `state.md` at a missing `board/Frozen.java` | **Fails as intended**: `everyJavaSourceLinkedFromAPatternPageExists` |
| Negative: Java catalog | Edited a row in the Java section by hand | **Fails as intended**: "docs/patterns/index.md is out of date" |
| Negative: TypeScript catalog | Edited a row in the TypeScript section by hand | **Fails as intended**, exit 1: "The TypeScript section ... is out of date" |
| Negative: lifecycle | Listed `ARCHIVE` in `Locked.allowedEvents()` without overriding `archive()` | **Fails as intended**: `allowedEventsMatchTheTransitionsAStateAccepts` |

All negative edits were reverted; the tree is clean.

## Not done and why

- **CI has not run on GitHub** for this branch; it is not pushed.
- **Karma not replaced** in the Angular host: needs a runner not in the policy table; proposed for
  INC-04.
- **Board lifecycle not exposed:** no REST resource, links, events, JSON definition, or XState
  machine until INC-01 and INC-02, as scoped.
- **Mediator (Angular `EventService`) not annotated**, as scoped: the TSDoc scanner reads only
  `web/packages`.
- **The live model flake is not fixed**, only made opt in. INC-03 (agent on real state) reworks
  the grounding it tests.
- **Deviations from the spec**, each small:
  - The spec expected `agent` to depend on `config`; the code has no such import, so `agent`
    declares no dependencies.
  - The spec counted 24 transition cases (4 by 6); there are 5 events, so the matrix is 20.
  - `web/packages/core` has one dev dependency beyond TypeScript: `@types/node`, for `node:test`
    types. Both hosts already use it; it is recorded in the audit.
  - Three changes beyond the spec: removing `testFailureIgnore` and making live model tests opt in
    (both approved by you mid increment), and sorting the Documenter's output (needed so the
    stale SVG check does not churn).
- **Size:** about 920 changed lines, excluding SVG, lock files, and the generated module docs;
  well under the spec's estimate.

## Next increment's entry criteria

INC-01 (Board resources) can start once this report is reviewed, ADR-0016 is accepted or changed,
the branch is merged, and all five workflows run green on GitHub. INC-01 should also pick up:

- The audit's INC-01 items: springdoc on the Boot 4 line, Jackson 2 or 3.
- The RFC 9457 ADR and problem `type` URIs, and the Docusaurus site, now that the repository is
  named `armature` for GitHub Pages.
