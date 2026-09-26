# 8. Spring Modulith modules with in process events; Kafka deferred

## Status

Accepted (recorded in INC-00b; decided in the plan, "Modularity with Spring Modulith" and
"Events and pub/sub")

## Context and Problem Statement

armature-ms will grow boards, capabilities, identity, agents, and channels. It needs internal
boundaries that are verified rather than hoped for, and a way for modules to react to each
other's changes without calling their internals, without committing yet to a message broker.

## Decision Drivers

- Boundaries checked at build time; one deployable.
- Events recorded durably in the same transaction as the change (a true outbox).
- A later move to Kafka should be configuration, not a redesign.

## Considered Options

- Spring Modulith application modules with Spring application events and the JDBC event
  publication registry.
- Separate microservices per module with Kafka from the start.
- OSGi bundles.

## Decision Outcome

Chosen option: "Spring Modulith with in process events," because it verifies module boundaries in
a test (`ApplicationModules.verify()`), documents them, and records events durably in PostgreSQL
(ADR-0003) while events are already shaped (CloudEvents, JSON Schema) for Kafka. Dynamic
extension across processes is handled by capabilities (ADR-0012), not by OSGi style class loading.

### Consequences

- A module's root package is its API; `internal` packages are off limits to other modules.
- Cross module reactions use events; calls are for queries and commands that need an answer.
- Hexagonal roles are marked with jMolecules and checked with its ArchUnit rules.
- Kafka is a deferred increment; adopting it adds Spring for Apache Kafka and Modulith
  externalization.

## More Information

`docs/plan/armature-plan.md`, "Modularity with Spring Modulith" and "Events and pub/sub". First
implemented in INC-00c (modules) and INC-09 (events and channels).
