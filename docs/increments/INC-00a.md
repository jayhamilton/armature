# INC-00a: Scaffold the new repository

## Goal and vision link

Turn this folder into the `armature-platform` monorepo by copying the current working trees of
`armature-ms`, `armature-ui`, and `armature-ui-react` into it, without git history and without
changing behavior. This increment serves no vision outcome directly; it builds the single
repository every later increment (board resources, HATEOAS, capabilities, channels) depends on.

## What was built

- `backend/` copied from `../armature-ms` (working tree; Spring Boot 4.1.0, Java 25).
- `web/hosts/angular/` copied from `../armature-ui` (working tree; Angular 22 reference UI).
- `web/hosts/react/` copied from `../armature-ui-react` (working tree; Vite/React 19 port, in
  progress).
- Root scaffolding: `README.md`, `ROADMAP.md`, `.gitignore`, `pnpm-workspace.yaml`, empty
  `contracts/` and `capabilities/` (each with `.gitkeep`), `web/packages/README.md`.
- Reference fixes: `web/hosts/angular/README.md`'s absolute `github.com/jayhamilton/armature/...`
  image and source links rewritten as relative paths; its microservice cross-links rewritten to
  `../../../backend/README.md`; `backend/README.md`'s `../armature-ui` link rewritten to
  `../web/hosts/angular`; the Angular CI workflow moved from
  `web/hosts/angular/.github/workflows/main.yml` to `.github/workflows/angular.yml` at the repo
  root with a `paths:` filter and `working-directory: web/hosts/angular`;
  `web/hosts/angular/.agent-pipeline.json`'s `repo` field updated to `jayhamilton/armature-platform`.
- `docs/adr/0001-record-architecture-decisions.md` and
  `docs/adr/0002-monorepo-fresh-history.md` (MADR).
- Git: repository initialized on `main` with one baseline commit (536 files), then branch
  `inc/00a-scaffold` for this increment's remaining work.

### Excluded from the copy (per the spec, confirmed with the user)

- `.git`, `node_modules`, `dist`, `target`, `.angular`, `.DS_Store`,
  `.claude/settings.local.json`, `.claude/worktrees` from all three sources.
- `armature-ms/CLAUDE.md` and `armature-ui/CLAUDE.md` (dropped; the root `CLAUDE.md` governs).
- `armature-ui/.work/` (SPEC/IMPL/TESTPLAN/RESULT history from the old spec-driven workflow,
  SPEC-50 through SPEC-73).
- `armature-ms/.github/modernize/java-upgrade/` (one-off automated Java-upgrade run output).
- `armature-ms/RPM/` and `armature-ms/systemd/` (legacy RPM spec and systemd unit for the
  service's old "dashboard" identity).
- The empty `armature-ui/untitled folder` (stray, no content).
- Kept, per the user's explicit answers: `.vscode/` from both `armature-ms` and `armature-ui`,
  and each repo's own `.gitignore` (not folded into one root file).

## Diagrams changed

None. C4 diagrams start in INC-00b.

## Decisions

- ADR-0001: record architecture decisions (MADR, adopts the practice).
- ADR-0002: one monorepo, created with fresh history (MADR, formalizes the plan's "Repository
  layout" decision and records that the three original repositories stay linked, not archived).

## Evidence

No new tests were written (behavior is unchanged; existing suites moved with their code).

| Check | Command | Result |
| --- | --- | --- |
| Backend tests | `cd backend && ./mvnw -q test` (JDK 25 required; see note below) | **Pass** — 5 test classes, 36 tests, 0 failures, 0 errors |
| Angular build | `cd web/hosts/angular && npm ci && npx ng build` | **Fails** — see "Not done and why" |
| Angular unit tests | `cd web/hosts/angular && npx ng test --watch=false --browsers=ChromeHeadless` | **24 of 26 pass** — see "Not done and why" for the 2 pre-existing failures |
| React build | `cd web/hosts/react && npm ci && npm run build` | **Pass** — `tsc -b && vite build` completes, output in `dist/` (one chunk-size warning, not an error) |
| Manual run | Backend (`./mvnw spring-boot:run`) + Angular dev server (`npx ng serve`) | **Pass at the HTTP level** — `GET /actuator/health` → 200; CORS preflight from `Origin: http://localhost:4200` to `POST /api/agent/chat` returns `Access-Control-Allow-Origin: http://localhost:4200`, confirming the dev server can reach the backend exactly as before. A full browser click-through (login, open the assistant panel, send a chat message) was not done: the Claude in Chrome extension was not connected in this session. |

**Environment note:** this machine's default JDK is 18.0.1 (with an unused 22.0.2 also present),
neither of which satisfies `<java.version>25</java.version>` in `pom.xml`. The user pointed to an
existing JDK 25 install at `$HOME/.jdks/jdk-25.0.2/jdk-25.0.2+10/Contents/Home`, used for the
`./mvnw` runs above via `JAVA_HOME`/`PATH`. This is a local machine setup concern, not something
this increment changed or needs to fix, but it's worth confirming any CI runner is configured with
a Java 25 toolchain before INC-00b wires up backend CI.

## Not done and why

- **`npx ng build` fails** with "bundle initial exceeded maximum budget. Budget 2.00 MB was not
  met by 242.21 kB with a total of 2.24 MB." The budget (`maximumError: 2mb` in `angular.json`)
  and the `src/` it's measuring are both copied unchanged from `armature-ui`, along with the same
  `package-lock.json`, so this is a pre-existing condition, not a regression introduced by the
  move. Per the user's decision, it is left unfixed here: raising the budget is a config/behavior
  change outside this increment's "copy without changing behavior" scope. Revisit in INC-00b's
  dependency audit or a dedicated increment.
- **2 of 26 Angular unit tests fail**, both pre-existing and unrelated to the copy:
  - `AppComponent should render title` expects the unedited Angular CLI boilerplate text
    ("armature app is running!") that the actual `AppComponent` template no longer renders.
  - `AreaChartComponent should create` throws `NG05105` (`Unexpected synthetic property
    @animationState found`) from `@swimlane/ngx-charts`, consistent with the dependency policy's
    existing note that `ngx-charts` "lags Angular majors" and is scheduled for retirement in
    INC-04.
  Neither is touched here, for the same "no behavior change" reason as the build budget.
- **Full browser verification of the login/chat flow** was not completed; the Claude in Chrome
  extension was not connected in this session. HTTP-level verification (health check, CORS
  preflight) confirms the wiring is unchanged; a human should still open `http://localhost:4200`
  once to eyeball it.
- **Repository not yet renamed, original repos not archived.** Per the plan's "Repository layout,"
  both happen later, when the team is comfortable.
- **Not pushed to GitHub.** Per CLAUDE.md, this increment does not push; that's a follow-up step
  for the user after reviewing this report.
- Everything else the plan defers past INC-00a (C4 diagrams, Spring Modulith restructuring,
  patterns/annotations, `LifecycleEngine`, dependency changes like removing
  `ace-editor-builds`) is intentionally out of scope here, per the approved spec.

## Next increment's entry criteria

INC-00b (Documentation, contracts, and CI) can start once this report is reviewed and the branch
is merged. It should also pick up, as part of its own scope:

- Deciding what to do about the Angular build budget and the two failing unit tests, now that
  they're documented rather than silently carried forward again.
- Confirming CI's Java toolchain is pinned to 25 before backend CI is wired up.
