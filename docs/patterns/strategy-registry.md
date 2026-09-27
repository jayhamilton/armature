# Strategy with registry

Consolidation without a new monolith depends on one move: supporting a new gadget, data source,
or channel adds a class and a registration, never an edit to code that already works. This
pattern is that move, and every extension seam in the plan uses it.

## Intent

Define a family of interchangeable behaviors, and select one at runtime by looking it up by name
(here, by `@type`) instead of branching on the name.

## The problem in Armature

The Angular host once chose a gadget component with a `switch` on `componentType`, so every new
gadget edited that `switch`. It now uses a lookup table
([`gadget-registry.ts`](../../web/hosts/angular/src/app/gadgets/gadget-registry.ts)), but that
table is Angular specific, and data sources, channel renderers, and gadget representations will
need the same thing in every host and in the backend.

## Participants

| Role | In Armature | Responsibility |
| --- | --- | --- |
| Registry | [`TypeRegistry`](../../web/packages/core/src/type-registry.ts) | Maps each `@type` to its strategy; refuses duplicates; reports unknown types clearly |
| Strategy | The registered value, for example a gadget element loader or a data source | One behavior for one `@type` |
| Client | The code that asks the registry, for example a gadget host | Calls `resolve(type)` and uses the strategy without knowing which one it is |

## Class diagram

![Strategy with registry class diagram](strategy-registry.svg)

Source: [`strategy-registry.puml`](strategy-registry.puml).

## SOLID callout

**Open/Closed.** A new `@type` is one `register` call next to the new strategy; clients and other
strategies do not change. **Dependency inversion** follows when the strategy type is an interface
owned by the client (for example a future `DataSourceStrategy`), so the client never depends on
a concrete implementation.

## Tests that prove it

[`type-registry.test.ts`](../../web/packages/core/src/type-registry.test.ts): resolving a
registered type, reporting an unknown one with the types that are registered, refusing a
duplicate, and listing types.

## Exercise

Create a `TypeRegistry` of number formatters keyed by `@type` (`Currency`, `Percentage`), then add
a third (`Duration`) and notice that neither the registry nor the code calling `resolve` changes.
