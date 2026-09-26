---
name: armature-architecture-review
description: Review an Armature branch against the architectural principles, the port catalog, CLAUDE.md's architecture rules, and the dependency policy before merge. Use when asked for an architecture review of an increment or a pull request.
---

# Architecture review

The review protects the plan's promise that Armature grows by adding classes and manifests, not
by editing a monolith. It reports findings; it does not fix them unless asked.

## Sources of the rules (read them; do not restate them)

- `docs/principles.md` and the plan, `docs/plan/armature-plan.md` ("Architectural principles",
  "Core abstractions and SOLID", "Port catalog", "Where not to abstract", "Module rules",
  "Guardrails against GenAI slop").
- `CLAUDE.md`, "Architecture rules" and "Dependencies".
- The ADRs in `docs/adr/`.
- The approved spec for the increment, `.work/specs/SPEC-INC-<nn>.md`.

## Scope

Review `git diff main...HEAD` (or the pull request's diff). Read surrounding code where a finding
depends on it.

## Checklist

For each item, answer pass, fail (with `path:line` and why), or not applicable.

1. **Spec scope:** every change is inside the approved spec's scope.
2. **No type switches:** no `switch`, `if` chain, or `instanceof` chain on `@type` or a gadget,
   data source, channel, or capability type. New behavior is a new class or manifest entry
   registered by `@type`.
3. **No rule in a facade:** REST controllers, MCP tools, A2A handlers, and channel adapters
   delegate to the domain; business and lifecycle rules live in the domain layer.
4. **No link without a state rule:** every HAL link is added only when `LifecycleEngine` allows
   the transition and `AccessPolicy` allows the actor. The UI decides from links, never from
   roles.
5. **Dependencies point inward:** domain code does not import facades or adapters; modules do not
   reach into another module's `internal` package; cross module reactions use events.
6. **Ports justified:** a new port has two implementations, or a second one scheduled in the plan.
7. **Errors:** RFC 9457 problem details only; each new problem type has a page in
   `docs/help/problems/`.
8. **State:** lifecycles use the State pattern behind `LifecycleEngine`; UI flows use XState;
   no Spring Statemachine.
9. **Dependencies:** anything added is listed in the plan's dependency policy table or was
   approved; `docs/architecture/dependency-audit.md` is updated.
10. **Docs in the same change:** diagrams, ADRs, and help pages describing the change are updated
    in the same branch, and `docs/architecture/check-svg.sh` passes.
11. **Teaching material:** classes implementing a pattern carry the pattern annotations or TSDoc
    tags (once they exist, INC-00c) with the Pattern, Principle, Why here, How to extend, See also
    headings.

## Executable checks

Run what exists and record results:

```bash
docs/architecture/check-svg.sh
cd backend && ./mvnw -q test
```

Until INC-00c adds the Spring Modulith verification test and the jMolecules and ArchUnit rules,
items 2, 3, and 5 are manual review items; say so in the output. Once those tests exist, a
passing test replaces the manual check.

## Output

A short list of findings ordered by severity, each with `path:line`, the rule it breaks (with its
source), and a suggested fix, followed by the checklist results. If there are no findings, say
so plainly.
