# 10. Local first UI with background sync

## Status

Accepted (recorded in INC-00b; decided in the plan, principle 6)

## Context and Problem Statement

Armature boards work with no backend at all today, which is worth keeping. Boards also need to be
shared, persisted, and reachable by agents (ADR-0003). The UI must not wait on the network, and
concurrent edits must not be silently lost.

## Decision Drivers

- Keep standalone mode.
- Same behavior in every host (framework free).
- Conflicts visible and recoverable.

## Considered Options

- Local first: IndexedDB store, JSON Patch outbox, `PATCH` with `If-Match` on the board `ETag`.
- Server first: every edit waits for the API.
- CRDTs (Yjs, Automerge) for real time co editing.

## Decision Outcome

Chosen option: "Local first with background sync," because edits apply at once, the sync engine
lives in framework free `@armature/core`, and optimistic concurrency with problem details handles
the realistic conflict rate. CRDTs are not adopted until simultaneous editing of one board is a
requirement.

### Consequences

- A stale version returns `412` as the `board-version-conflict` problem with remediation links.
- An XState sync machine (`idle`, `syncing`, `offline`, `conflict`, `error`) drives a visible
  status indicator.
- A one time migration moves existing `localStorage` boards to IndexedDB.
- With no backend configured, sync is off and Armature runs entirely locally.

## More Information

`docs/plan/armature-plan.md`, principle 6. First implemented in INC-01.
