# Architectural principles

These principles are how Armature keeps its promise of interfaces that are described rather than
built: the server says what is possible, behavior arrives as new classes or manifests, and every
client, human or agent, follows the same rules. A change that breaks one needs an ADR explaining
why. This page is a summary; the [plan](plan/armature-plan.md#architectural-principles) holds the
detail and wins if the two disagree.

## 1. REST by TMF 630

Resources carry `id`, `href`, and `@type`, and support `fields`, filtering, sorting, `offset` and
`limit`, and both PATCH media types. The one deliberate deviation: errors are RFC 9457 problem
details, not the TMF error object. See [ADR-0007](adr/0007-tmf630-in-house.md).

## 2. HATEOAS as the engine of state, for people and agents

Responses are plain HAL with state gated links. A link appears only when the lifecycle and
`AccessPolicy` both allow it, and the UI shows or hides functions from links, never from role
checks. See [ADR-0004](adr/0004-plain-hal-state-gated-links.md).

## 3. Open/Closed through Strategy and State

New behavior is a new class or manifest entry found through a registry keyed by `@type`, never an
edited `switch` or an `instanceof` chain. Data sources, channel renderers, model providers, and
capability transports are strategies; resource lifecycles are states.

## 4. Explicit state machines, on both sides

Backend lifecycles use a hand written State pattern behind `LifecycleEngine`; UI flows use
XState; both are tested against one JSON lifecycle definition. See
[ADR-0006](adr/0006-state-pattern-lifecycles.md).

## 5. Declared extension, VS Code style

Capabilities are manifests with `contributes`, activation events, and `when` clauses. See
[ADR-0012](adr/0012-capability-manifests.md).

## 6. Local first, with background sync

The UI works on a local IndexedDB copy and syncs with `PATCH`, `If-Match`, and `ETag`; conflicts
are problems, not silent overwrites; with no backend, Armature runs entirely locally. See
[ADR-0010](adr/0010-local-first-ui.md).

## Supporting rules

- **Modules:** Spring Modulith application modules; cross module reactions use events
  ([ADR-0008](adr/0008-spring-modulith-in-process-events.md)).
- **Persistence:** PostgreSQL through Spring Data JDBC ([ADR-0003](adr/0003-postgresql-spring-data-jdbc.md)).
- **Real time:** SSE, one stream per client ([ADR-0009](adr/0009-sse-not-websockets.md)).
- **Identity:** Armature's own OIDC issuer; `ActorResolver` and `AccessPolicy` ([ADR-0011](adr/0011-own-oidc-issuer.md)).
- **Abstractions:** add a port only when two implementations exist or are scheduled.
- **Dependencies:** the policy in [ADR-0005](adr/0005-dependency-policy.md), audited in
  [`architecture/dependency-audit.md`](architecture/dependency-audit.md).
- **Diagrams:** as code, never hand drawn ([ADR-0013](adr/0013-diagrams-as-code.md)).
