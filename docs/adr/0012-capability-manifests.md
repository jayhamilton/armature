# 12. Capability manifests modeled on VS Code extensions

## Status

Accepted (recorded in INC-00b; decided in the plan, principle 5 and "Extension model")

## Context and Problem Statement

Consolidation without a new monolith means each service (Fiber, 5G, Device Management, Billing)
contributes gadgets, data sources, tools, commands, and help without an Armature release.
Something has to describe those contributions.

## Decision Drivers

- Adding a service is a manifest, not a portal.
- Contributions appear only when relevant.
- A familiar, proven shape.

## Considered Options

- Manifests modeled on the VS Code extension manifest (`contributes`, `activationEvents`, `when`).
- In process plugins (OSGi or classpath scanning).
- Hand wired integration per service.

## Decision Outcome

Chosen option: "Manifests modeled on VS Code," because the shape is well understood (identity,
`engines`, activation events, contribution points, dependencies) and it works across processes
through MCP and A2A, which in process plugins cannot.

### Consequences

- Capabilities have their own lifecycle (`DISCOVERED` to `ACTIVE`, `FAILED`, `DISABLED`) with
  state gated links (ADR-0004, ADR-0006).
- A command is shown only if its `when` clause is true and the target resource offers the link.
- Capabilities may import only `contracts/`.

## More Information

`docs/plan/armature-plan.md`, "Extension model: capability manifests". First implemented in INC-06.
