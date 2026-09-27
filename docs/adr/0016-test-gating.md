# 16. Failing tests fail the build; live model tests are opt in

## Status

Proposed (stubbed in INC-00c; needs review)

## Context and Problem Statement

`backend/pom.xml` came from armature-ms with surefire's `testFailureIgnore` set, so a failing test
never failed `./mvnw test` or CI. INC-00c adds tests meant to be gates (`ModularityTest`,
`PatternCatalogTest`, `BoardLifecycleTest`), which only work if a failure fails the build. Once
the flag was removed, `AgentServiceTest`, which calls a live local Ollama model, failed 2 of 3
reruns of one test because the model's answers vary.

## Decision Drivers

- Checks gate completion (CLAUDE.md); a gate that cannot fail is not a gate.
- The default build must be deterministic, so a red build always means something changed.
- Tests against a real model are still worth running on purpose.

## Considered Options

- Remove `testFailureIgnore`; tag live model tests `live-model` and exclude that tag by default.
- Remove `testFailureIgnore`; disable individual flaky live model tests.
- Keep `testFailureIgnore`.

## Decision Outcome

Chosen option: "Remove `testFailureIgnore` and make live model tests opt in," because it restores
the build as a gate without losing the live tests: they run with
`./mvnw test -Dgroups=live-model -DexcludedGroups=`.

### Consequences

- The default backend build ran 59 tests in INC-00c; the 8 live model tests are not among them.
- Flakiness in live model tests stays visible when they are run, rather than hidden.
- Measured claims about model behavior (guardrail 8) need their own fixed prompt set; these
  tests are not that evidence.

## More Information

`docs/increments/INC-00c.md`; `backend/README.md`, "Build and test".
