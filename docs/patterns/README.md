# Pattern catalog

Armature is teaching material: each extension seam is a named design pattern, so readers can
learn the pattern from code that runs in production.

Start at the generated [catalog](index.md). Each pattern has a page following the plan's template
(intent, the problem in Armature, participants, class diagram, SOLID callout, tests, exercise):

- [State](state.md): the board lifecycle.
- [Strategy with registry](strategy-registry.md): `TypeRegistry` in `@armature/core`, and the PATCH
  media types in the backend.
- [Adapter](adapter.md): board storage behind `BoardRepository`.
- [Builder](builder.md): RFC 9457 problems from `ProblemBuilder`.
- [Interpreter and Specification](interpreter-specification.md): TMF 630 filters.

More pages arrive with the patterns they describe (see the plan's "Initial catalog").
