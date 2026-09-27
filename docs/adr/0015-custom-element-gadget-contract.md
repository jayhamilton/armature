# 15. Gadgets are custom elements registered by @type

## Status

Accepted (recorded in INC-00c; decided in the plan, "The gadget contract is a custom element")

## Context and Problem Statement

Gadgets are Angular components today, and the React port reimplements each one. The plan keeps
five hosts (React, Angular, Svelte, Lit, vanilla) and wants other teams to contribute gadgets
through capability manifests without adopting Armature's framework. A gadget needs one contract
every host can render unchanged.

## Decision Drivers

- One implementation of each gadget, rendered by every host.
- Contributing teams choose their own authoring tool.
- Native platform features, no framework runtime in the contract.
- Registration by `@type`, like every other Armature extension seam (Open/Closed).

## Considered Options

- Custom elements (Web Components), registered by `@type`.
- A framework component per host (the status quo: Angular components, React ports).
- Iframes for every gadget (as MCP Apps use).

## Decision Outcome

Chosen option: "Custom elements registered by `@type`," because every host framework renders
them natively (React 19 supports custom element properties and events; Angular through
`CUSTOM_ELEMENTS_SCHEMA`), and they cost no iframe per gadget. MCP Apps stay a separate gadget
representation for third party UI that needs sandboxing (INC-07).

The contract:

- **Registration:** a registry maps `@type` to a tag name and a lazy import (the
  `TypeRegistry` in `@armature/core`, generalizing today's `gadget-registry.ts`).
- **Inputs are properties:** `config`, `data`, `semanticType`, `locked`.
- **Outputs are DOM events:** `armature-configure`, `armature-action`, `armature-problem`.
- **Theming:** CSS custom properties (the existing `--app-*` tokens) and `::part`.
- **Authoring:** Lit, vanilla, or Svelte compiled to a custom element.

### Consequences

- Built in gadgets move into `@armature/elements` (Lit) in INC-04, and chart gadgets move to one
  Chart.js implementation, retiring ngx-charts and Recharts.
- A host conformance suite (Playwright) renders the same gadgets in every host.
- Hosts may import only the public entry points of `core` and `elements`, enforced by
  dependency-cruiser.

## More Information

`docs/plan/armature-plan.md`, "Multi framework UI"; `docs/patterns/strategy-registry.md`;
`docs/architecture/c4/web-layers-target.svg`.
