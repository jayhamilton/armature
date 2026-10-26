# 19. RFC 9457 problem details instead of the TMF error object

## Status

Accepted (decided in the plan, "Error and help strategy"; recorded and first implemented in INC-01a)

## Context and Problem Statement

TMF 630 defines its own error object (`code`, `reason`, `message`, `status`, `referenceError`).
Armature wants every error to lead somewhere useful: a person should see what to do, the user
guide should have a page for it, and the assistant should be able to explain it from the same
source. Which error format should the API return?

## Decision Drivers

- One help catalog feeding the error UI, the user guide, and the assistant.
- Native support in Spring (`ProblemDetail`, `ErrorResponse`), so the framework's own errors come
  out in the same shape.
- A standard that MCP clients, peer agents, and gateways already recognize.
- Room for Armature's own members (a stable code, a trace id, field errors, remediation links).

## Considered Options

- RFC 9457 problem details (`application/problem+json`), which obsoletes RFC 7807.
- The TMF 630 error object.
- Both, chosen per request by content negotiation.

## Decision Outcome

Chosen option: "RFC 9457 problem details," because the RFC recommends that a problem's `type` be
a URI that resolves to human readable documentation, which is exactly the link from an error to
its help page. Spring produces it natively and it allows extension members.

- `type` is a permanent identifier on GitHub Pages
  (`https://jayhamilton.github.io/armature/problems/<slug>`), the same for every deployment.
- `_links.help` is where this deployment serves its own copy (`/help/problems/<slug>`); clients
  recognize a problem by `type` and open help by following the link.
- Extension members: `code` (stable, for logs and support), `traceId`, `errors[]` with JSON
  Pointers, and later `capability` and remediation links (INC-02).
- The core never produces the TMF error object. A consumer that needs it can get it from an edge
  mapper (`code`, `reason`, `message`, `status`, `referenceError` from `code`, `title`, `detail`,
  `status`, `type`).

### Consequences

- Every problem type is a `ProblemType` entry with a page in `docs/help/problems/` that has the
  sections *What happened*, *Why*, *What you can do*, and *For the assistant*.
  `ProblemCatalogTest` fails when an entry and its page disagree, when either is missing, or when
  no test produces the problem.
- Only `ProblemBuilder` creates problem bodies; `ProblemArchitectureTest` enforces it.
- This is a deliberate deviation from TMF 630, listed in `docs/api/tmf630-conformance.md`.
- Until the user guide site is published (INC-01d), the `type` URIs do not resolve on GitHub
  Pages; `_links.help` does.

## More Information

[RFC 9457](https://www.rfc-editor.org/rfc/rfc9457.html); ADR-0007 (TMF 630 in house);
ADR-0014 (the user guide site); `docs/patterns/builder.md`.
