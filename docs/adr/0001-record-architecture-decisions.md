# 1. Record architecture decisions

## Status

Accepted

## Context and Problem Statement

Armature is being rebuilt across several increments (see `docs/plan/armature-plan.md`), each of
which makes decisions with long-lived consequences: dependency choices, deviations from standards
(RFC 9457 over the TMF error object), and architectural stances (State pattern over Spring
Statemachine, SSE over WebSockets). Without a record, later readers, including future sessions of
this same assistant, have no way to tell a deliberate decision from an oversight, or to see why an
alternative was rejected.

## Decision Drivers

- The plan itself already narrates several decisions in prose; they need a stable, browsable home.
- CLAUDE.md requires that "a change that breaks one [architectural principle] needs an ADR
  explaining why," which presumes ADRs are already a working practice.
- The codebase is explicitly teaching material (see "Code as teaching material" in the plan); a
  decision log is part of what makes it legible.

## Considered Options

- No formal record; rely on commit messages and the plan document.
- Architecture Decision Records (ADRs) in [MADR](https://adr.github.io/madr/) format, one per
  decision, under `docs/adr/`.

## Decision Outcome

Chosen option: "Architecture Decision Records in MADR format," because it is a lightweight,
widely recognized convention that fits a single markdown file per decision, is easy to link from
increment reports, and is explicitly required by CLAUDE.md's guardrails.

### Consequences

- Every increment report has a "Decisions" section listing any ADRs it adds (see the report
  template in the plan).
- Decisions already made in the plan (RFC 9457, PostgreSQL, the dependency policy, and so on) get
  their own ADR numbers as each relevant increment lands, rather than all at once, so each ADR can
  cite the code that exists when it is written.
- This ADR is itself ADR-0001, following the common "record that we record decisions" convention.

## More Information

See `docs/plan/armature-plan.md` for the decisions already made in prose; each is expected to gain
its own ADR by the increment listed in that plan's dependency policy and architectural principles
sections.
