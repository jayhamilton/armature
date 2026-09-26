# 7. TMF 630 conventions, implemented in house

## Status

Accepted (recorded in INC-00b; decided in the plan, principle 1)

## Context and Problem Statement

Board, gadget, capability, and data source resources follow the TMF 630 REST API Design
Guidelines: `id` and `href`, `@type` polymorphism, `fields` selection, filtering and sorting,
`offset` and `limit` pagination, and both PATCH media types. Something has to parse and apply
those query rules.

## Decision Drivers

- Dependency policy (ADR-0005).
- The query parser is a natural teaching example.

## Considered Options

- Implement TMF 630 querying in a `tmf` module.
- Adopt the opentmf tmf630-toolkit for Spring Web MVC.

## Decision Outcome

Chosen option: "Implement it in a `tmf` module," because tmf630-toolkit is a very small community
project that fails the dependency policy. The toolkit is used only as a reference, and the parser
becomes the Interpreter and Specification pattern example.

### Consequences

- A TMF 630 conformance suite (and a `.http` file) must pass for every new resource.
- Errors are the one deliberate deviation from TMF 630: RFC 9457 problem details, recorded in its
  own ADR in INC-01.

## More Information

`docs/plan/armature-plan.md`, principle 1. First implemented in INC-01.
