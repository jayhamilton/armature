# 13. Diagrams as code: C4-PlantUML with a stale SVG check

## Status

Accepted (recorded in INC-00b; decided in the plan, "Diagram conventions")

## Context and Problem Statement

Increment reports are read before diffs (the plan's guardrail 7), so diagrams must be current and
reviewable. Hand drawn diagrams drift silently.

## Decision Drivers

- Diagrams reviewable as text in pull requests.
- One toolchain for C4, sequences, and the Spring Modulith Documenter output.
- Readable on GitHub without a build step.
- Drift fails the build.

## Considered Options

- C4-PlantUML and PlantUML sources, SVG committed next to each source, CI stale check.
- Structurizr DSL.
- Mermaid.
- Hand drawn diagrams.

## Decision Outcome

Chosen option: "C4-PlantUML with committed SVGs," because the Modulith Documenter already emits
C4-PlantUML, sequences use the same tool, and committed SVGs render anywhere.

### Consequences

- `docs/architecture/render.sh` renders every `docs/**/*.puml` with a pinned, checksum verified
  PlantUML jar using its bundled C4 library and Smetana layout (no Graphviz).
- `docs/architecture/check-svg.sh` (run by the Docs workflow) fails on a stale, missing, or
  orphaned SVG. It compares the source PlantUML embeds in each SVG rather than the drawn output,
  so it does not flap on font metric differences between macOS and Linux.
- State diagrams are generated from the XState machine or JSON lifecycle definition (ADR-0006).
- Every diagram element maps to a real package, module, or deployable; target views say so.

## More Information

`docs/plan/armature-plan.md`, "Diagram conventions". Implemented in INC-00b.
