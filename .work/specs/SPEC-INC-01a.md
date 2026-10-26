# SPEC-INC-01a: Board resources, part 1 (TMF 630 API, problems, help catalog)

## Goal

Give boards a real REST home. After this increment a client can create, list, filter, page, read,
partially update, and delete boards, their rows, and their gadget instances over a TMF 630 shaped
API, and every error the API returns is an RFC 9457 problem whose `type` names a help page that
exists in `docs/help/problems/` and is served by the backend at `_links.help`.

Storage is the in memory `BoardRepository` adapter (the plan's demo default). PostgreSQL, ETags,
identity, and the local first UI follow in 01b to 01d.

## Vision outcome served

**Deliver anywhere.** A board stops being a `localStorage` blob that only one browser can see and
becomes a resource any client (UI host, MCP client, peer agent, channel) can address by `href`.
The demo "boards follow you from laptop to phone" needs this API first (01b makes it durable,
01d makes the UI use it).

## How INC-01 is split (decided 2026-10-25)

The plan's INC-01 is far over the 1,500 changed line guardrail, so it runs as four increments, each
with its own spec and report:

| Inc | Scope | Demo |
| --- | --- | --- |
| **01a** (this) | TMF 630 board, row, gadget instance resources (in memory); `tmf` query module; RFC 9457 problem factory; help catalog with gadget help moved and first problem pages; ADR on RFC 9457 | A `.http` file exercises every TMF 630 rule and passes |
| 01b | PostgreSQL through Spring Data JDBC, Flyway, Testcontainers, Docker Compose; `version` as `ETag`, `If-Match` required on PATCH, `board-version-conflict` and `precondition-required` problems; both repository adapters pass one contract suite | Restart the backend, the board is still there; a stale PATCH gets 412 |
| 01c | `identity` module: own OIDC authorization server, BFF login, users, organizations as tenants, role, permission, role assignment tables, `ActorResolver`, `AccessPolicy`, authorization matrix test, `authentication-required` and `not-permitted` problems | A second user sees a board only after it is shared |
| 01d | React first then Angular: IndexedDB store and outbox in `@armature/core`, sync engine and XState sync machine, `localStorage` migration, `ErrorPresenter`; first user guide build from `docs/help` | A board created in one browser appears in another; offline edits sync; a conflict shows working remediation |

## Entry criteria (status)

- INC-00e and `fix/inc-00e-review` merged (done, PRs #7 and #9). CI on `main` is green.
- ADR-0018: **accepted** by the owner on 2026-10-25; this increment changes its status.
- Manual voice input and read aloud check: **waived** by the owner on 2026-10-25.
- INC-00f (architecture guardrails): **deferred** by the owner; not part of INC-01.

## Scope

### 0. Housekeeping

- ADR-0018 status from Proposed to Accepted.

### 1. `tmf` module: TMF 630 querying (new Modulith module, no dependencies)

Written in house per ADR-0007; the opentmf toolkit is a reference only.

- `QueryParameters`: parses a request's query string into `fields`, `sort`, `offset`, `limit`, and
  filters. Reserved names are `fields`, `sort`, `offset`, `limit`; every other parameter is a filter.
- **Filters (Interpreter and Specification):** `attr=value`, `attr=a,b` (any of), and the operator
  forms `attr.gt=`, `attr.gte=`, `attr.lt=`, `attr.lte=`, `attr.ne=`. Dotted paths reach nested
  fields (`state=DRAFT`, `row.structure=6-6`). Each filter parses into a `Specification`
  (`Equals`, `AnyOf`, `Compare`), combined with `And`; a specification evaluates against a
  resource's JSON tree, so it works for any resource without per type code. Values compare as
  numbers or ISO 8601 date times when both sides parse as such, otherwise as strings.
- **Sort:** `sort=title`, `sort=-lastUpdate`, several keys comma separated.
- **Fields:** `fields=title,state` returns only those attributes plus `id`, `href`, `@type`
  (always). `fields=none` returns only those three.
- **Pagination:** `offset` (default 0) and `limit` (default 20, maximum 100). Responses carry
  `X-Total-Count` and `X-Result-Count`; status is `206 Partial Content` when the page holds fewer
  items than the total, otherwise `200`.
- `QueryEngine.apply(list, parameters)` returns the page plus counts. A bad parameter (unknown
  operator, non numeric `limit`, `limit` over 100, unknown field in `sort`) raises
  `InvalidQueryException`.
- Annotated `@DesignPattern(INTERPRETER_SPECIFICATION)` with the Javadoc headings; pattern page
  `docs/patterns/interpreter-specification.md`.
- Filtering runs in memory over the repository's results in this increment. 01b may push simple
  filters down to SQL; the engine's contract stays the same.

### 2. `problem` module: RFC 9457 (new Modulith module, depends on nothing but Spring)

- `ProblemType` enum: one entry per problem, with slug, title, status, and stable `code`.
  Entries in this increment:

  | Slug | Status | Code | Raised when |
  | --- | --- | --- | --- |
  | `resource-not-found` | 404 | `ARM-RES-404-NOT-FOUND` | board, row, or gadget instance id does not exist |
  | `invalid-query` | 400 | `ARM-QUERY-400-INVALID` | a TMF 630 query parameter cannot be applied |
  | `invalid-request` | 400 | `ARM-REQ-400-INVALID` | body fails validation; `errors[]` holds JSON Pointers |
  | `invalid-patch` | 422 | `ARM-PATCH-422-INVALID` | a patch is malformed, a JSON Patch `test` fails, or a path does not exist |
  | `unsupported-media-type` | 415 | `ARM-MEDIA-415-UNSUPPORTED` | PATCH with anything but the two patch media types |
  | `transition-not-allowed` | 409 | `ARM-LIFECYCLE-409-NOT-ALLOWED` | `TransitionNotAllowedException` (mapped now; raised by API calls from INC-02) |
  | `internal-error` | 500 | `ARM-500-INTERNAL` | anything unmapped; detail never leaks the exception message |

- `ProblemBuilder` (Builder pattern): `ProblemBuilder.of(type).detail(...).instance(...)
  .error(pointer, message).build()` produces a Spring `ProblemDetail` with `type` set to
  `https://jayhamilton.github.io/armature/problems/<slug>`, the `code`, `traceId` (from the
  request's `traceparent` if present, otherwise generated), `errors`, and
  `_links.help.href = /help/problems/<slug>`. Plain map `_links` for now; HAL types arrive in INC-02.
- `ProblemAdvice` (`@RestControllerAdvice`): maps domain exceptions and Spring's own
  (`HttpMediaTypeNotSupportedException`, `HttpMessageNotReadableException`, `NoResourceFoundException`)
  to problems, through a registry of mappers keyed by exception class (no `instanceof` chain).
  Content type `application/problem+json`.
- `spring.mvc.problemdetails.enabled=true` so anything Spring raises itself is a problem too.
- **Enforcement tests:**
  - `ProblemCatalogTest`: every `ProblemType` has `docs/help/problems/<slug>.md` with front matter
    (`type`, `title`, `status`, `code`) matching the enum and the four required sections
    (*What happened*, *Why*, *What you can do*, *For the assistant*); every page has an enum entry.
  - Every `ProblemType` is produced by at least one web test (a test tag names the slug; the
    catalog test checks the set is complete).
  - ArchUnit rule: no controller returns a `ResponseEntity` with a non problem error body; only
    `ProblemBuilder` creates `ProblemDetail`.

### 3. `help` module: the help catalog over HTTP

- `docs/help/problems/*.md`: one page per problem type above.
- `docs/help/gadgets/*.md`: the 11 gadget pages **moved** from the hosts (they are identical in
  both today). Hosts copy them at build time instead of keeping their own copies:
  React with a `prebuild`/`predev` script into `public/assets/help` (git ignored), Angular with an
  `angular.json` asset glob from `../../../docs/help/gadgets`. The help panel code does not change.
- Backend: Maven copies `docs/help` onto the classpath at build (`maven-resources-plugin`).
  `HelpCatalog` port (a second, capability contributed implementation is scheduled for INC-06)
  with a `ClasspathHelpCatalog` adapter.
- `GET /help/problems/{slug}` and `GET /help/gadgets/{slug}`: `text/markdown` by default and
  `application/json` (front matter plus body) on request; an unknown slug is the
  `resource-not-found` problem. HTML for people comes from the user guide site in 01d.
- `docs/help/README.md` updated: layout, front matter, required sections.

### 4. `board` module: resources

**No version in the path** (decided by the owner, 2026-10-25; ADR-0020). Resources sit at the
root, as the plan's own examples already do (`/board/42/unlock`), so the resources are:

| Method and path | Purpose |
| --- | --- |
| `GET /board` | list, with every TMF 630 query rule |
| `POST /board` | create; `201` with `Location`; starts in the lifecycle's initial state (`DRAFT`) |
| `GET /board/{id}` | read, with `fields` |
| `PATCH /board/{id}` | `application/merge-patch+json` or `application/json-patch+json` |
| `DELETE /board/{id}` | `204` |
| `GET, POST /board/{id}/row`; `GET, PATCH, DELETE /board/{id}/row/{rowId}` | rows of one board |
| `GET, POST /gadgetInstance`; `GET, PATCH, DELETE /gadgetInstance/{id}` | gadget instances; `POST` names `board.id`, `row.id`, and `column`; list filters such as `board.id=` work through the generic engine |

- **Model (one aggregate):** `Board` (`id`, `href`, `@type: Board`, `title`, `description`,
  `icon`, `contentWidth`, `state`, `version`, `creationDate`, `lastUpdate`, `rows`), `Row`
  (`id`, `structure`, `columns: [{gadgetInstanceIds}]`), and `GadgetInstance` (`id`, `href`,
  `@type` = the gadget's type such as `BarChartGadget`, `@baseType: GadgetInstance`, `title`,
  `board`, `row`, `column`, `order`, `properties` as a JSON object). The aggregate saves and loads
  as one unit; gadget instance endpoints load and save their board. `version` increments on every
  change (01b exposes it as `ETag`).
- **Lifecycle:** `state` is set from `BoardLifecycle.initialState()` and is read only through
  PATCH (an attempt is `invalid-patch`); transitions as API calls are INC-02.
- `BoardRepository` port (`@Port`, `@Repository` role) with `InMemoryBoardRepository` adapter.
  A contract test suite (`BoardRepositoryContract`, abstract) runs against the in memory adapter
  now and the PostgreSQL adapter in 01b.
- `BoardService` is the only writer; controllers translate HTTP and nothing else.
- **PATCH, both media types, in house:** a `PatchStrategy` per media type in a registry keyed by
  media type (Strategy with registry): `MergePatch` (RFC 7386) and `JsonPatch` (RFC 6902: `add`,
  `remove`, `replace`, `move`, `copy`, `test`) over Jackson trees, then validated by binding back
  to the model. No patch library is added (none passes the dependency policy).
- OpenAPI annotations on every operation; problems documented as `application/problem+json`.
- `board` module's `allowedDependencies` gains `tmf` and `problem`.
- The existing `BoardSnapshotStore` in `agent` is untouched (agent tools move onto `BoardService`
  in INC-03).

### 5. Evolving the API without versions in URIs

TMF 630 puts the major version in the path (`/tmf-api/{api}/v4/...`). Armature does not, following
Roy Fielding's position on REST API versioning: a URI names a resource, not a release of the
server, and an API that is driven by hypermedia evolves without one. A version in the path gives
every resource a new identity on each release, breaks bookmarks, pinned answers, and stored
`href`s, and pushes clients to build URIs instead of following links. That works against outcome 4
(the same `href` reachable from the UI, MCP, A2A, and channels) and against ADR-0004.

- **ADR-0020, "No version in resource URIs":** records the decision as a second deliberate
  deviation from TMF 630 (next to RFC 9457), and how the API evolves instead:
  - changes are additive; clients ignore members they do not know;
  - new behavior is a new resource, a new link relation, or a new `@type`, never a changed meaning
    of an existing one;
  - clients follow links (`href`, and HAL from INC-02) instead of building URIs, so the server can
    move a resource without breaking anyone;
  - if an incompatible representation is ever unavoidable, it is a new media type or a `profile`
    parameter negotiated with `Accept`, served next to the old one at the same URI;
  - events and contracts keep their own schema versions (`dev.armature.board.published.v2`), which
    version message types, not resource identities. This is unchanged.
- **The plan is updated:** principle 1's table gains an *Identity and evolution* row that points
  at ADR-0020.
- **Enforced by a test:** `ApiPathTest` (ArchUnit over the request mappings) fails if any
  `@RequestMapping` family path contains a version segment (`/v1`, `/v2`, `/api/v3`, ...). The
  existing `/api/agent/chat` and `/api/endpoints` have none and pass as they are.
- `docs/api/tmf630-conformance.md` lists the path rule as a deviation and links ADR-0020.

### 6. Skills

- `.claude/skills/armature-add-rest-resource`: controller, service, repository port and adapter,
  TMF 630 query handling, OpenAPI annotations, conformance tests, `.http` entries; must pass the
  conformance suite and the problem catalog test before it reports done. **It never puts a
  version in a path:** it states the rule and its reason (ADR-0020), tells the author how to make
  a change additive or reach for a new resource, link relation, or media type instead, and runs
  `ApiPathTest` as one of its checks. A request for a `/v2` path is answered with those options,
  not with the path.
- `.claude/skills/armature-add-problem-type`: enum entry, exception and mapper, help page with the
  four sections, a test that produces it; must pass `ProblemCatalogTest`.

## Out of scope (and where it goes)

- PostgreSQL, Flyway, ETag and If-Match, version conflicts: 01b.
- Authentication, authorization, tenants, sharing; the API is open like today's endpoints: 01c.
- Any UI change beyond where the gadget help files come from: 01d.
- HAL (`application/hal+json`), links other than `_links.help` on problems, lifecycle transition
  endpoints, domain events: INC-02.
- Docusaurus site and GitHub Pages publication of the problem pages: 01d. Until then the `type`
  URIs do not resolve on the public site; the backend's `_links.help` does.
- JSON-LD views: later, with the ontology work.

## Files and modules touched

| Area | Files |
| --- | --- |
| Backend, new modules | `tmf/*`, `problem/*`, `help/*` under `com.addf.backend.armature` |
| Backend, board | `board/Board.java`, `Row`, `GadgetInstance`, `BoardService`, `BoardRepository`, `internal/InMemoryBoardRepository`, `BoardController`, `RowController`, `GadgetInstanceController`, `patch/*`, `package-info.java` |
| Backend, build | `pom.xml` (resources copy of `docs/help`; no new dependencies), `application.properties` |
| Backend, tests | `tmf` unit tests, patch unit tests, `BoardRepositoryContract` plus in memory run, web tests for every resource and problem, `ProblemCatalogTest`, ArchUnit rule, `ModularityTest` and Documenter output refreshed |
| HTTP | `backend/http/board-resources.http` (every TMF 630 rule, runnable in IntelliJ or VS Code REST Client) |
| Hosts | React `package.json` scripts and `.gitignore`; Angular `angular.json` assets; delete both `assets/help` copies |
| Docs | `docs/help/{problems,gadgets}/`, `docs/help/README.md`, `docs/api/tmf630-conformance.md`, `docs/api/README.md`, ADR-0019 (RFC 9457 over the TMF error object), ADR-0020 (no version in resource URIs), ADR-0018 status, `docs/patterns/interpreter-specification.md` and `builder.md` (with `.puml` and `.svg`), pattern catalog regenerated, C4 container and armature-ms component views updated, sequence `board-crud.puml`, module diagrams regenerated |
| Skills | `.claude/skills/armature-add-rest-resource`, `.claude/skills/armature-add-problem-type` |
| Report | `docs/increments/INC-01a.md` |

## Tests and checks that gate completion

- `cd backend && ./mvnw -q test` passes, including `ModularityTest`, `PatternCatalogTest`,
  `ProblemCatalogTest`, `ApiPathTest`, the ArchUnit rules, and the new web tests.
- TMF 630 conformance tests cover: `id` and `href` on every resource, `fields` (including
  `none`), each filter form, multi key sort, `offset` and `limit` with both count headers and
  `206`, both PATCH media types, `415` on another media type, `201` with `Location`.
- Every `ProblemType` is produced by a test.
- Both hosts still build and their conformance suites pass (help panel loads a gadget page from
  the moved files).
- Docs workflow: diagrams up to date.

## Size estimate

About 1,200 lines of production Java, 900 of tests, and 500 of docs and help pages. That is over
the guardrail if tests count. If the build runs clearly past it, I stop and propose moving JSON
Patch (keeping merge patch) to 01b rather than trimming tests.

## Decisions (approved by the owner, 2026-10-25)

1. Resources at the root (`/board`, `/gadgetInstance`) with no prefix and no version.
2. Gadget instances as a top level `gadgetInstance` collection (filterable by `board.id`), while
   still saved as part of the board aggregate.
3. Default page size 20, maximum 100.
4. The user guide site (and so public `type` URI resolution) waits for 01d.

## Amendments made during the build (2026-10-25, for review)

Recorded here so the spec matches what was built; each is listed in the report.

1. **Two more problem types,** `method-not-allowed` (405) and `not-acceptable` (406). Spring MVC
   raises both for any resource; without them those responses would have had no help page,
   breaking "every error has a page".
2. **`EndpointController` (datasource module) returns problems:** its two bare `404` responses
   now throw `ResourceNotFoundException` (same status, problem body). Needed for the ArchUnit
   rule that no controller answers an error without a problem.
3. **Gadget help copy:** Angular refuses asset paths outside its workspace, so both hosts copy
   `docs/help/gadgets` with one script (`web/hosts/copy-gadget-help.mjs`) on install, dev, and
   build, instead of an `angular.json` glob.
4. **Pattern page `adapter.md`:** `BoardRepository` and its adapter carry `@DesignPattern(ADAPTER)`,
   and the catalog test requires the page.
5. **`HttpFileTest`:** replays the `.http` file in every build, so "the `.http` file passes" is
   checked, not claimed.
6. **`armature-architecture-review`** gains a checklist item for ADR-0020.
