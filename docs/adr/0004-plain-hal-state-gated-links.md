# 4. Plain HAL with state gated links

## Status

Accepted (recorded in INC-00b; decided in the plan, principle 2)

## Context and Problem Statement

Every client (the Angular and React hosts, MCP clients, A2A peers) today hard codes what a user
may do with a board. The plan's stance, from *HATEOAS as the Cure for MCP Tool Bloat*, is that the
API tells the client what is possible right now. A hypermedia format has to carry that.

## Decision Drivers

- One format for people and agents.
- Links must reflect both the resource's lifecycle state and the actor's permissions.
- Spring HATEOAS support, so assemblers stay small and readable.
- Clients (including agents) must be able to learn what following a link means.

## Considered Options

- Plain HAL (`application/hal+json`) plus a link relation catalog.
- HAL-FORMS, which carries method and body templates in each response.
- Siren or JSON:API.

## Decision Outcome

Chosen option: "Plain HAL plus a link relation catalog," because it is the simplest format Spring
HATEOAS supports fully, and defining each relation's method and body once in a catalog keeps
responses small. HAL CURIEs point every `arm:` relation at its catalog page.

### Consequences

- A link appears only when the lifecycle allows the transition **and** `AccessPolicy` allows the
  actor (ADR-0011). The UI shows or hides functions from links, never from role checks.
- `docs/api/link-relations.md` becomes the catalog, maintained with each new relation.
- The MCP surface shrinks to a few navigation entry points plus typed write shortcuts.

## More Information

`docs/plan/armature-plan.md`, principle 2 and "Authentication and authorization". First
implemented in INC-02.
