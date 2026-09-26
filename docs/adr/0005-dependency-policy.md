# 5. Dependency policy

## Status

Accepted (recorded in INC-00b; decided in the plan, "Dependency policy")

## Context and Problem Statement

Armature is meant to outlive any single library, and its code is teaching material. The baseline
already carries dependencies that are stale (`ace-editor-builds`), in maintenance mode (Spring
Statemachine was planned), or lagging framework majors (`@swimlane/ngx-charts`).

## Decision Drivers

- Keep the platform on currently supported Spring Boot and UI framework majors.
- Avoid single maintainer or abandoned libraries in the domain path.
- Prefer in house code where it also teaches a pattern.

## Considered Options

- An explicit policy with a verdict per dependency, re-checked each increment.
- Case by case judgment in code review.

## Decision Outcome

Chosen option: "An explicit policy." A library is allowed only if it is backed by a foundation or
vendor, or is clearly active (a release within 12 months and more than one maintainer), and
supports the current Spring Boot major and the current major of each supported UI framework.
Anything in the domain path also sits behind a port so it can be replaced. Otherwise the code is
written in house.

### Consequences

- The plan's dependency table records named verdicts (for example Spring Statemachine removed,
  tmf630-toolkit not adopted, `ace-editor-builds` removed, ngx-charts retired in INC-04).
- `docs/architecture/dependency-audit.md` gives every direct dependency a verdict and is
  re-checked in each increment report.
- Adding a dependency not listed in the plan's table requires asking first (CLAUDE.md).

## More Information

`docs/plan/armature-plan.md`, "Dependency policy". First audit: INC-00b.
