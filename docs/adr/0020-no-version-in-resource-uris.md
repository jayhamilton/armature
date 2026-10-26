# 20. No version in resource URIs

## Status

Accepted (decided by the owner on 2026-10-25; recorded and first implemented in INC-01a)

## Context and Problem Statement

TMF 630 APIs put the major version in the path (`/tmf-api/{apiName}/v4/{resource}`), and many
REST APIs do the same (`/api/v1/...`). Armature's resources are meant to be addressed by the same
`href` from the UI, MCP clients, peer agents, channel messages, and pinned answers, possibly for
years. Should resource paths carry a version?

## Decision Drivers

- Outcome 4 of the plan, *deliver anywhere*: an `href` in a Teams message, a bookmark, a stored
  pinned answer, or a peer agent's memory must keep working.
- ADR-0004: clients follow links instead of building URIs.
- Roy Fielding's position on versioning REST APIs: a URI identifies a resource, not a release of
  the software behind it, and an API driven by hypermedia should evolve without one. Putting a
  version in the URI gives every resource a new identity at each release and tells clients the
  old ones may stop working.

## Considered Options

- No version in the path; the API evolves compatibly.
- TMF 630 style major version in the path (`/tmf-api/boardManagement/v4/board`).
- A version header or media type parameter on every request.

## Decision Outcome

Chosen option: "No version in the path," because a resource's identity must outlive releases,
and Armature already has the tools to evolve without one:

- **Additive change.** New members are added; existing members keep their meaning. Clients ignore
  members they do not know (TMF 630 and HAL both expect this).
- **New behavior is new things.** A new resource, a new link relation, or a new `@type` (with
  `@baseType` and `@schemaLocation`), never a changed meaning for an existing one.
- **Links, not URI templates in clients.** Clients follow `href` and, from INC-02, HAL links and
  the link relation catalog, so the server can move or add resources without breaking anyone.
- **If an incompatible representation is ever unavoidable,** it is a new media type or a
  `profile` parameter negotiated with `Accept`, served at the same URI next to the old one, with a
  deprecation period. That is a new ADR when it happens.
- **Events and contracts still carry schema versions** (`dev.armature.board.published.v2`,
  `engines.armature`). Those version message types and extension contracts, not resource
  identities, and are unchanged by this decision.

### Consequences

- Resources live at the root: `/board`, `/board/{id}/row`, `/gadgetInstance`, `/help/...`.
- `ApiPathTest` fails the build if any request mapping contains a version segment (`/v1`, `/v2`,
  `/api/v3`).
- The `armature-add-rest-resource` skill states this rule, offers the alternatives above when a
  versioned path is requested, and runs `ApiPathTest` before it reports done.
- This is a second deliberate deviation from TMF 630 (with RFC 9457 errors), listed in
  `docs/api/tmf630-conformance.md` and in the plan's principle 1.
- Compatibility now depends on discipline instead of a number: a breaking change cannot hide
  behind `/v2`. Reviews (`armature-architecture-review`) check that changes are additive.

## More Information

Roy T. Fielding, on versioning in REST APIs (his talks and writing on REST evolution);
[TMF 630 REST API Design Guidelines](https://www.tmforum.org/resources/specifications/tmf630-rest-api-design-guidelines-5-0-0/);
ADR-0004 (plain HAL, state gated links); ADR-0007 (TMF 630 in house).
