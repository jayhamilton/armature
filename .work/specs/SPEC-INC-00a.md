# SPEC-INC-00a: Scaffold the new repository

## Goal

Turn this folder into the `armature-platform` monorepo by copying the current working trees of
`armature-ms`, `armature-ui`, and `armature-ui-react` into it, without their git history and
without changing behavior. This is the foundation increment: nothing here changes what the
applications do, only where their code lives.

## Vision outcome served

All four outcomes, indirectly: this increment builds the single repository that every later
increment (board resources, HATEOAS, capabilities, channels) depends on. It advances none of the
four outcomes directly, and the increment report will say so.

## Scope

### 1. Copy source trees (rsync/cp only, no git commands in the source repos)

| Source | Destination |
| --- | --- |
| `../armature-ms` (working tree) | `backend/` |
| `../armature-ui` (working tree) | `web/hosts/angular/` |
| `../armature-ui-react` (working tree) | `web/hosts/react/` |

Universally excluded from all three copies: `.git`, `node_modules`, `dist`, `target`, `.angular`,
`.DS_Store`, `.claude/settings.local.json`, `.claude/worktrees`.

Resolved per repo, from the open questions the user answered:

- **Keep:** `.vscode/` from both `armature-ms` and `armature-ui` (shared debug/editor config, no
  machine-specific paths).
- **Keep:** each repo's own `.gitignore`, copied to `backend/.gitignore`,
  `web/hosts/angular/.gitignore`, `web/hosts/react/.gitignore` (Maven vs. Angular vs. Vite ignore
  patterns are different enough to keep separate).
- **Drop:** `armature-ms/CLAUDE.md` and `armature-ui/CLAUDE.md` (nested guidance folds into or is
  superseded by the root `CLAUDE.md`; not copied).
- **Drop:** `armature-ui/.agent-pipeline.json`'s only if it turns out to be pure duplication --
  see note below; default is keep with paths fixed, since the kickoff prompt calls it out by name
  as something to fix rather than drop.
- **Drop:** `armature-ui/.work/` (SPEC/IMPL/TESTPLAN/RESULT history from the old spec-driven
  workflow, SPEC-50 through SPEC-73) -- superseded by this repo's own `.work/specs/SPEC-INC-nn.md`
  convention; not copied.
- **Drop:** `armature-ms/.github/modernize/java-upgrade/` (one-off automated Java-upgrade run
  output: timestamped logs, plan, hook scripts) -- not copied.
- **Drop:** `armature-ms/RPM/` and `armature-ms/systemd/` (legacy RPM spec and systemd unit for the
  service's old "dashboard" identity; not referenced anywhere in the plan's target architecture) --
  not copied.
- **Drop:** the empty `armature-ui/untitled folder` (stray, no content) -- not copied.

Everything else in each working tree (`src/`, `documentation/`, `README.md`,
`MODEL_INTEGRATION.md`, `AGENTIC_PROTOCOLS.md`, `pom.xml`, `mvnw`/`mvnw.cmd`, `.mvn/`, `LICENSE`,
`package.json`, `package-lock.json`, `angular.json`, `karma.conf.js`, `tsconfig*.json`,
`.editorconfig`, `.oxlintrc.json`, `vite.config.ts`, `index.html`, `public/`, `PORTING_STATUS.md`)
is copied as-is.

### 2. Root scaffolding

- `README.md`: vision in one paragraph, repository layout, how to run each stack (backend,
  Angular host, React host), links to the three original repositories for their history.
- `ROADMAP.md`: the increment table (00a-10) and the demo scenario/services table from the plan.
- `.gitignore`: repo-wide concerns only (`.DS_Store`, `.work/`, editor noise not already covered by
  a per-stack `.gitignore`); it does not duplicate Maven/Angular/Vite patterns already in the
  per-stack files.
- `pnpm-workspace.yaml`: `web/packages/*`, `web/hosts/*`.
- `contracts/` and `capabilities/`: empty, with a `.gitkeep` each (per the plan's repository
  layout; content arrives in later increments).
- `web/packages/`: directory with a `README.md` stub noting `core` and `elements` arrive in
  INC-00c / INC-04.

### 3. Fix references broken by the move

- `web/hosts/angular/README.md`: convert absolute `github.com/jayhamilton/armature/blob/main/...`
  image and source links to relative paths (they now resolve from `web/hosts/angular/`); convert
  `github.com/jayhamilton/armature-ms#...` links to relative links into `../../../backend/README.md`.
- `backend/README.md`: convert the `[../armature-ui](../armature-ui)` link to
  `../web/hosts/angular`.
- Angular CI workflow: move `armature-ui/.github/workflows/main.yml` to
  `.github/workflows/angular.yml` at the repo root, add a `paths:` filter on
  `web/hosts/angular/**`, and a `working-directory: web/hosts/angular` on each step. The existing
  file is also stale (Node 12, `actions/checkout@v1`, invalid YAML on the `runs-on` line) --
  fixing the syntax error is necessary just to make it a valid workflow file; modernizing the Node
  version/action versions is an explicit exception to "no behavior change" because the file does
  not currently run at all as committed. Flagged in the increment report either way.
- `web/hosts/angular/.agent-pipeline.json`: update the `repo` field
  (`jayhamilton/armature` -> `jayhamilton/armature-platform`); the `projectContext` paths
  (`src/app/gadgets/...`) stay correct unchanged since they are relative to
  `web/hosts/angular/`.
- Root `README.md` links to the original repos point at
  `https://github.com/jayhamilton/armature-ms`, `https://github.com/jayhamilton/armature-ui`,
  `https://github.com/jayhamilton/armature-ui-react` (their real GitHub locations, for history).

### 4. ADRs

- `docs/adr/0001-record-architecture-decisions.md` (MADR, the standard "we use ADRs" record).
- `docs/adr/0002-monorepo-fresh-history.md` (MADR: one new repo, copied without history, per the
  plan's "Repository layout" section; original repos stay as the historical record and are linked,
  not archived, until the team is ready).

### 5. Git

- `git init`, default branch `main`.
- Initial commit on `main` with the scaffolded repository (this is the point-in-time baseline the
  ADRs describe).
- Branch `inc/00a-scaffold` for the remaining work in this increment, per CLAUDE.md's branch
  convention.

### 6. Verification (commands and output recorded in the increment report)

- `cd backend && ./mvnw -q test`
- `cd web/hosts/angular && npm ci && npx ng build`
- `cd web/hosts/angular && npx ng test --watch=false --browsers=ChromeHeadless`
- `cd web/hosts/react && npm ci && npm run build`
- Manual: run the backend (`./mvnw spring-boot:run`) and the Angular host (`npm start`), confirm
  the Angular app talks to the backend at `http://localhost:8080` exactly as it did as separate
  repos (login/chat flow, per `environment.ts`'s `apihost`).

### 7. Report

`docs/increments/INC-00a.md`, written from the plan's report template (goal and vision link, what
was built, diagrams changed [none -- diagrams start in INC-00b], decisions [ADR-0001, ADR-0002],
evidence [command output above], not done and why, next increment's entry criteria).

## Out of scope

- Renaming the repository to `armature` (deferred until the team is comfortable, per the plan).
- Archiving or renaming the three original repositories.
- Any dependency changes (removing `ace-editor-builds`, upgrading CI action/Node versions beyond
  the minimum fix to make the workflow valid YAML) -- that is INC-00b's dependency audit.
- C4 diagrams, Spring Modulith restructuring, patterns/annotations, `LifecycleEngine` -- INC-00b
  and INC-00c.
- `web/hosts/svelte`, `web/hosts/lit`, `web/hosts/vanilla` -- not in the plan until later.
- Any behavior change to backend or UI code beyond the reference-path fixes in section 3 above.

## Files and modules touched

- New: `backend/**` (from `armature-ms`), `web/hosts/angular/**` (from `armature-ui`),
  `web/hosts/react/**` (from `armature-ui-react`), root `README.md`, `ROADMAP.md`, `.gitignore`,
  `pnpm-workspace.yaml`, `contracts/.gitkeep`, `capabilities/.gitkeep`, `web/packages/README.md`,
  `docs/adr/0001-record-architecture-decisions.md`, `docs/adr/0002-monorepo-fresh-history.md`,
  `docs/increments/INC-00a.md`, `.github/workflows/angular.yml`.
- Edited after copy: `web/hosts/angular/README.md`, `backend/README.md`,
  `web/hosts/angular/.agent-pipeline.json`.
- Not touched: `docs/plan/armature-plan.md`, `docs/plan/KICKOFF-INC-00a.md`, root `CLAUDE.md`
  (already present).

## Tests

No new tests are written in this increment (behavior is unchanged). The existing test suites move
with their code and must still pass:

- Backend: existing JUnit suite under `backend/src/test`, run via `./mvnw -q test`.
- Angular: existing Karma/Jasmine specs, run via `ng test --watch=false --browsers=ChromeHeadless`.
- React: no test suite exists yet in `armature-ui-react` (confirmed: no test script in
  `package.json`); `npm run build` (`tsc -b && vite build`) is the verification for that host.

## Docs to update

- `README.md`, `ROADMAP.md` (new, root).
- `docs/adr/0001-*.md`, `docs/adr/0002-*.md` (new).
- `docs/increments/INC-00a.md` (new).
- `web/hosts/angular/README.md`, `backend/README.md` (link fixes only).

## Open item carried forward (not blocking approval)

`web/hosts/angular/.agent-pipeline.json` is kept per the kickoff prompt's explicit instruction to
fix its paths rather than drop it, even though its `projectContext` prose describes the Angular
app as if it were still the whole repository. No content change beyond the `repo` field is planned
for this increment; revisit if it causes confusion once capabilities and other hosts exist.
