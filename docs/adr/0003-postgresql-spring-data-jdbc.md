# 3. PostgreSQL through Spring Data JDBC

## Status

Accepted (recorded in INC-00b; decided in the plan, "Persistence")

## Context and Problem Statement

Boards live only in browser `localStorage` today. To deliver boards anywhere (another device, an
MCP client, a peer agent) they need a durable, shared store. Board data mixes fields that are
queried and governed (owner, sharing, lifecycle state, version) with fields each gadget type
defines for itself (property values, data configuration).

## Decision Drivers

- TMF 630 filters and sorting must map to real queries.
- Optimistic locking must surface as `ETag` and `If-Match` for local first sync (ADR-0010).
- Domain events must be recorded in the same transaction as the change (ADR-0008).
- Code is teaching material: no lazy loading, session state, or hidden SQL.
- A demo must still run with zero setup.

## Considered Options

- PostgreSQL with Spring Data JDBC, relational columns plus JSONB.
- PostgreSQL with Spring Data JPA (Hibernate).
- A document database (for example MongoDB).

## Decision Outcome

Chosen option: "PostgreSQL with Spring Data JDBC," because aggregates load and save as one unit
with no entity graph, JSONB holds gadget defined data without schema churn, GIN indexes serve
TMF 630 filters, and Spring Modulith's event publication registry shares the transaction.

### Consequences

- A `Board` aggregate saves with its rows and gadget instances; a small JSONB converter is the
  Adapter pattern example.
- `version` drives optimistic locking, exposed as `ETag`.
- Schema changes go through Flyway migrations, reviewed like code.
- An in memory `BoardRepository` adapter is the demo default; PostgreSQL runs by profile, with
  Testcontainers in tests and Docker Compose locally. Both pass the same contract suite.
- pgvector can later hold help catalog embeddings.

## More Information

`docs/plan/armature-plan.md`, "Persistence (decided, ADR-0003)". First implemented in INC-01.
