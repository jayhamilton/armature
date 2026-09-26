# Armature platform: guidance for Claude Code

This repository is the Armature monorepo: a runtime for interfaces that are described rather than built.
The plan in `docs/plan/armature-plan.md` is the source of truth for scope, architecture, and order of work.
Read it before planning any change. When this file and the plan disagree, the plan wins; say so.

## How work happens here

1. **One increment per session.** Increments are listed in the plan (INC-00a, INC-00b, INC-00c, INC-01, ...).
   Never start the next increment without being asked.
2. **Plan first.** Start in plan mode. Write a spec to `.work/specs/SPEC-INC-<nn>.md`: goal, which vision outcome
   it serves, scope, out of scope, files and modules touched, tests, docs to update. Stop and wait for approval.
3. **Build only what the approved spec says.** If something outside the spec is needed, stop and ask.
4. **Finish with a report.** Write `docs/increments/INC-<nn>.md` using the template in the plan
   (goal and vision link, what was built, diagrams changed, decisions, evidence, not done and why, next entry criteria).
5. **Checks gate completion.** Never report an increment as done with failing builds, tests, or checks.
   Report what failed instead.
6. **Git:** work on a branch named `inc/<nn>-<short-name>`; small, descriptive commits; never push, force push,
   rewrite history, or delete branches unless asked.

## Boundaries

- Never modify anything outside this repository.
- `../armature-ui`, `../armature-ms`, and `../armature-ui-react` are the original repositories. They are
  read only sources for INC-00a. Do not run git commands that write in them (not even `git status`, which
  can create a lock file); copy files with `rsync` or `cp` only.

## Architecture rules (summary; details in the plan)

- **REST:** TMF 630 conventions (id, href, @type, fields, filtering, offset and limit, both PATCH media types).
- **Errors:** RFC 9457 problem details only, never the TMF error object. Every problem type has a help page in
  `docs/help/problems/`; `type` URIs use `https://jayhamilton.github.io/armature/problems/<slug>`,
  `_links.help` points at the deployment's own copy.
- **Hypermedia:** plain HAL. A link appears only when both the lifecycle and `AccessPolicy` allow it. The UI
  shows or hides functions from links, never from role checks.
- **Open/Closed:** new behavior is a new class or manifest entry found through a registry keyed by `@type`.
  No `switch` or `instanceof` chains on type.
- **State:** lifecycles use the hand written State pattern behind `LifecycleEngine` (sealed interfaces).
  Spring Statemachine is not allowed. UI flows use XState.
- **Modules:** backend is Spring Modulith application modules; other modules' `internal` packages are off limits;
  cross module reactions use events. Hexagonal roles marked with jMolecules.
- **Abstractions:** add a port only when two implementations exist or are scheduled in the plan.
- **Persistence:** PostgreSQL through Spring Data JDBC, Flyway migrations; an in memory adapter for demos.
- **Events:** Spring application events via Spring Modulith with the JDBC publication registry. No Kafka yet.
- **Real time:** SSE, one stream per client. No WebSockets.
- **Local first:** the UI works on a local copy (IndexedDB) and syncs with PATCH, If-Match, and ETag.
- **Identity:** Armature's own OIDC issuer (Spring Security 7 authorization server); roles and permissions in
  PostgreSQL behind `ActorResolver` and `AccessPolicy`.
- **Web:** framework free `web/packages/core` and Lit based `web/packages/elements`; hosts in `web/hosts/*`
  (React is the reference). Gadgets are custom elements.

## Dependencies

Follow the dependency policy table in the plan. Do not add a dependency that is not listed there without asking.
Removed or not adopted: Spring Statemachine, opentmf tmf630-toolkit, `ace-editor-builds`.

## Code as teaching material

- Classes that implement a design pattern carry `@DesignPattern` and `@SolidPrinciple` (Java) or `@pattern`,
  `@role`, `@principle` TSDoc tags (TypeScript), once those exist (INC-00c).
- Javadoc on those types uses the headings: Pattern, Principle, Why here, How to extend, See also.
- Prefer clear, readable code over clever code. This repository is used to teach.

## Documentation

- Diagrams: C4 with C4-PlantUML (`.puml` plus rendered `.svg`), sequences with PlantUML, state from the
  XState machine or JSON lifecycle definition. Never hand drawn.
- Decisions: one ADR per decision in `docs/adr/` (MADR format).
- Update docs in the same change as the code they describe.
- Prose style: avoid dashes as punctuation in prose (use commas, colons, parentheses, or separate sentences).

## Commands

| Stack | Build and test |
| --- | --- |
| Backend (Java 25) | `cd backend && ./mvnw -q test` |
| Angular host | `cd web/hosts/angular && npm ci && npx ng build && npx ng test --watch=false --browsers=ChromeHeadless` |
| React host | `cd web/hosts/react && npm ci && npm run build` |
