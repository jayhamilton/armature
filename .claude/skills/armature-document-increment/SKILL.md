---
name: armature-document-increment
description: Write the increment report docs/increments/INC-<nn>.md for the current Armature increment, list changed diagrams, stub any missing ADRs, and run the documentation checks. Use at the end of an increment, after the approved spec's work is built and its checks pass.
---

# Document an Armature increment

The increment report is the gate: the reviewer reads it and the diagrams before the diff (plan,
"Guardrails against GenAI slop", rule 7). A report that does not explain a change in terms of the
vision means the change is questioned.

## Inputs to read first

1. The approved spec, `.work/specs/SPEC-INC-<nn>.md`: goal, vision outcome, scope, out of scope.
2. The plan's entry for the increment and its "Increment report template" section in
   `docs/plan/armature-plan.md`. The template there is authoritative; do not restate it here.
3. The previous report in `docs/increments/` for its "Next increment's entry criteria".
4. What changed: `git diff --stat main...HEAD` and `git log --oneline main..HEAD`.

## Steps

1. **Map changes to the template.** For each changed package, endpoint, machine, gadget, workflow,
   or document, decide which template section it belongs in. Link to code by repository path.
2. **Diagrams changed.** List every added or edited `.puml` (and its `.svg`) under `docs/`. For
   every changed backend package or web package, check that some C4 view in
   `docs/architecture/c4/` (or a module or component view) contains it. If one does not, say so
   in the report under "Not done and why"; never add an element to a diagram that does not map
   to real code.
3. **Decisions.** List ADRs added in `docs/adr/`. If the increment made a decision that has no
   ADR, stub one in MADR format (Status: Proposed) with the next free number and say it needs
   review.
4. **Evidence.** Record the exact commands run and their results for every stack the increment
   touched, using the commands table in `CLAUDE.md`. Record failures as failures. Include counts
   (tests run, passed, failed) rather than "tests pass".
5. **Dependency policy.** Note any dependency added, removed, or re-verdicted, and update
   `docs/architecture/dependency-audit.md` in the same change (ADR-0005 requires a re-check each
   increment).
6. **Not done and why.** Every scope cut, skipped verification, and known failure, with the
   reason. Nothing is silently carried forward.
7. **Next increment's entry criteria.** What must be true before the next increment starts,
   including anything this increment deferred to it.
8. Write the report to `docs/increments/INC-<nn>.md`. Follow CLAUDE.md prose style: no dashes as
   punctuation.

## Checks (must pass before reporting done)

```bash
docs/architecture/check-svg.sh
```

If a check fails, do not call the increment done. Report the failure and its output instead.
