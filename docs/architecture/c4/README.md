# C4 views

These views show who reaches Armature and through which doors, which is how the plan's claim of
one set of boards delivered anywhere is checked against what actually runs.

| View | File | Shows |
| --- | --- | --- |
| Context (current) | [`context.puml`](context.puml), [`context.svg`](context.svg) | Armature today, its users, and the model providers and clients it talks to |
| Container (current) | [`container-current.puml`](container-current.puml), [`container-current.svg`](container-current.svg) | The deployables that exist today: `backend/`, the Angular and React hosts, browser storage |
| Container (target) | [`container-target.puml`](container-target.puml), [`container-target.svg`](container-target.svg) | The plan's target: four facades over one domain layer, a capability registry, PostgreSQL |

Every element in a *current* view maps to a real directory or deployable. The *target* view is the
plan's destination; as each increment builds part of it, that increment updates the current view.
Component views arrive with the code they describe (INC-00c onward).

To change a diagram, edit the `.puml`, run `docs/architecture/render.sh`, and commit both files.
CI runs `docs/architecture/check-svg.sh`, which fails if they disagree
([ADR-0013](../../adr/0013-diagrams-as-code.md)).
