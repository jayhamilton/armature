---
name: armature-add-rest-resource
description: Add a TMF 630 REST resource to the Armature backend (controller, service, repository port and adapter, representations, query and PATCH handling, problems, OpenAPI, tests, .http entries, docs). Use when asked to expose a new resource or collection over HTTP, or to add an endpoint to an existing one. Refuses versioned paths.
---

# Add a REST resource

Every resource follows the same TMF 630 rules, so a client that learns them once (the UI, an MCP
client, a peer agent) can use any resource. This skill builds a resource the way `/board`,
`/board/{id}/row`, and `/gadgetInstance` are built, and does not report done until the checks pass.

## Rules (read the sources; do not restate them in code)

- `docs/api/tmf630-conformance.md`: identity, `fields`, filters, `sort`, `offset` and `limit`,
  count headers and `206`, both PATCH media types, `201` with `Location`, `204` on delete.
- `docs/adr/0019-rfc9457-problem-details.md`: errors are problems only.
- `docs/adr/0020-no-version-in-resource-uris.md`: **no version in any path.**
- `CLAUDE.md`, "Architecture rules"; the plan's "Core abstractions and SOLID".

## No version in the path (ADR-0020)

Never create a path with a version segment: no `/v1`, `/v2`, `/api/v3`, `/tmf-api/.../v4`, even
though TMF 630 shows one. A URI names a resource, not a release of the server (Roy Fielding's
position on REST API versioning); a client that stored an `href` must keep reaching the same
resource. `ApiPathTest` fails the build on a versioned mapping.

When a change seems to need a new version, offer these instead, in this order:

1. **Make it additive:** add a member; keep every existing member's meaning. Clients ignore what
   they do not know.
2. **Add something new:** a new resource, a new link relation, or a new `@type` with `@baseType`,
   instead of changing what an existing one means.
3. **Negotiate a representation:** only if an incompatible shape is unavoidable, a new media type
   or a `profile` parameter on `Accept`, served at the same URI beside the old one, with a new ADR.

If someone asks for a `/v2` path, answer with these options and do not create the path.

## Steps

1. **Place it.** Decide the owning Modulith module. Add the resource to the C4 component view
   first if it is a new seam (plan, "Guardrails", rule 2). Paths sit at the root (`/thing`,
   `/thing/{id}/part`), camelCase singular nouns, as TMF 630 names them.
2. **Domain.** An aggregate (`@AggregateRoot`) that is immutable and checks its own rules,
   raising `InvalidRequestException` or `ResourceNotFoundException` (never returning an error
   body). A service (`@Service`) is the only writer.
3. **Storage.** A repository port in the module's root package (`@SecondaryPort`) only if a
   second adapter exists or is scheduled; an in memory adapter under `internal`
   (`@SecondaryAdapter`); an abstract contract test that every adapter's test extends.
4. **Representations.** Records with `id`, `href` (relative, built from one helper), and
   `@type`; references as `{id, href, @type}`. Declare the attribute set (for query checks) and
   the editable set (for PATCH).
5. **Controller** (`@PrimaryAdapter`, `@RestController`): translate HTTP to service calls and
   nothing else.
   - Lists: `@RequestParam MultiValueMap` into `QueryParameters.parse`, then
     `QueryEngine.apply(..., ATTRIBUTES)` and `TmfResponses.page`.
   - Reads: `QueryParameters.fieldsOnly` and `QueryEngine.select`.
   - Create: `201` with `ResponseEntity.created(URI.create(href))`.
   - PATCH: `consumes = { PatchStrategy.MERGE_PATCH_JSON, PatchStrategy.JSON_PATCH_JSON }`; apply
     with `PatchStrategies.apply(contentType, representation, patch, EDITABLE)`; read back with a
     record marked `@JsonIgnoreProperties(ignoreUnknown = true)`.
   - Delete: `204`.
   - `@Operation` on every method, `@Tag` and the class level problem `@ApiResponse`.
6. **Problems.** Reuse existing types; for a new one, use `armature-add-problem-type`.
7. **Module boundaries.** Add `tmf` and `problem` to the module's `allowedDependencies`.
8. **Tests.**
   - An `ApiTest` subclass covering every row of the conformance table for this resource;
     tests tag their own data (the application context is shared).
   - `@ProducesProblem("<slug>")` on a test for each problem the resource is the first to raise.
   - Unit tests for the aggregate's rules.
9. **Walkthrough.** Add requests to a `backend/http/*.http` file, each with `# @expect <status>`;
   point `HttpFileTest` at a new file if you add one.
10. **Docs.** Add the resource to `docs/api/tmf630-conformance.md`; update the container view and
    a sequence if the scenario is new; run `ModuleDocumentationTest` and
    `docs/architecture/render.sh`.

## Checks (all must pass before reporting done)

```bash
cd backend && ./mvnw -q test        # includes ApiPathTest, ProblemCatalogTest, ProblemArchitectureTest,
                                    # ModularityTest, PatternCatalogTest, HttpFileTest
cd .. && docs/architecture/check-svg.sh
```

If any check fails, report which one and why; do not report the resource as done.
