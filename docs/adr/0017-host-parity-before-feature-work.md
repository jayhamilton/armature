# 17. Bring the React host to parity before feature work, proven by a conformance suite

## Status

Accepted (recorded in INC-00d; requested by the owner)

## Context and Problem Statement

The plan names React as the reference host: feature increments from INC-01 onward build there
first. After INC-00c the React port still lacked functions the Angular host has (the icon,
illustration, and endpoint pickers, the markdown editor, endpoint management, and the assistant).
Starting INC-01 in a host with known gaps would mean either building features on a partial host
or porting old behavior and new behavior at the same time. A second question follows: how does
anyone know the hosts are at parity, and stay there?

## Decision Drivers

- The reference host should be complete before it becomes the place new work lands first.
- Parity must be checkable by a machine, not asserted after reading two codebases side by side.
- The check should grow into the plan's host conformance suite (Liskov at the UI level), not be
  throwaway.
- Increments stay within the plan's size guideline.

## Considered Options

- Start INC-01 now and port the missing functions alongside feature work.
- Insert parity increments before INC-01 (INC-00d settings and forms, INC-00e the assistant), with
  parity proven by a Playwright suite that runs unchanged against every host.
- Insert parity increments, with parity proven by a manual comparison checklist.

## Decision Outcome

Chosen option: "Insert parity increments, proven by a conformance suite," because it makes the
reference host honest before it leads, and it starts the conformance suite the plan already calls
for, so later hosts (Lit, Svelte, vanilla) prove themselves the same way.

The suite (`web/conformance`) uses roles and accessible names only. When a scenario cannot find an
element in one host, the fix is accessible markup in that host, never a host specific branch in
the test. Backend calls are stubbed per test, so the suite needs neither armature-ms nor Ollama.

### Consequences

- Good: INC-01 starts from a React host with every function the Angular host has.
- Good: both hosts gained accessible names they lacked, and writing the scenarios found two Angular
  bugs that a line by line comparison had missed (the Board settings dialog never closed after
  Add; the Endpoints tab's empty message never reappeared).
- Bad: two increments of work that add no new capability.
- Neutral: CI runs the suite against React only for now; Angular runs it locally until a later
  increment adds it to CI.

## More Information

`.work/specs/SPEC-INC-00d.md`, `.work/specs/SPEC-INC-00e.md`, `web/conformance/README.md`,
`docs/plan/armature-plan.md` ("Host conformance suite").
