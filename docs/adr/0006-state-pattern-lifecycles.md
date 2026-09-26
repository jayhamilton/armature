# 6. Lifecycles as a hand written State pattern, XState in the UI

## Status

Accepted (recorded in INC-00b; decided in the plan, principle 4)

## Context and Problem Statement

Boards, capabilities, pinned answers, and composition tasks each have a lifecycle. Today state is
implied by boolean flags. The lifecycle decides which links appear (ADR-0004), which problems are
raised, and which events are published, so it must be explicit and shared by backend and UI.

## Decision Drivers

- Spring Boot 4 support.
- Readability as a teaching example.
- One definition that the backend, the UI, and the link rules can all be tested against.

## Considered Options

- Hand written State pattern (sealed interfaces) behind a `LifecycleEngine` port.
- Spring Statemachine.
- Boolean flags and conditionals (the status quo).

## Decision Outcome

Chosen option: "Hand written State pattern behind `LifecycleEngine`," because Spring Statemachine
is in maintenance mode with no plan to support Spring Boot 4 (spring-statemachine issue 1207),
and a sealed hierarchy where each state knows its allowed events is small and readable. The UI
uses XState v5 for flows that are genuinely stateful.

### Consequences

- Lifecycle states and events are published as a JSON machine definition in `contracts/`; the
  Java engine, the XState machines, and the link rules are tested against it.
- State diagrams are generated from the machines, never drawn by hand (ADR-0013).
- The board lifecycle is the reference State pattern example (INC-00c).

## More Information

`docs/plan/armature-plan.md`, principle 4. First implemented in INC-00c.
