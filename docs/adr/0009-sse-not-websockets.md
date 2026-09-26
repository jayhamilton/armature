# 9. Real time updates over SSE, not WebSockets

## Status

Accepted (recorded in INC-00b; decided in the plan, "Real time updates")

## Context and Problem Statement

Gadgets and boards need to update when data or boards change elsewhere (another device, the
assistant, an MCP client, a peer agent). A transport for server to client updates is needed.

## Decision Drivers

- The traffic is one way; writes already go through REST with lifecycle rules and problems.
- Missed events must be replayed after a client sleeps or goes offline.
- Must pass corporate proxies and use the same authentication as the REST API.
- AG-UI and MCP streamable HTTP already use SSE.

## Considered Options

- Server Sent Events, one stream per client.
- WebSockets.
- Polling.

## Decision Outcome

Chosen option: "SSE, one stream per client," because it reconnects automatically with
`Last-Event-ID` (replayed from the event publication registry), is plain HTTP, and HTTP/2 removes
the old connection limit.

### Consequences

- `GET /eventStream?board={id}` carries thin events with links; `@armature/core` fans them out to
  gadgets.
- Data sources declare `updateMode` (`push`, `poll`, `none`); updates per gadget are coalesced.
- WebSockets are reserved for real time co editing, which is out of scope; if needed they fit
  inside one `core` stream client module.

## More Information

`docs/plan/armature-plan.md`, "Real time updates: SSE, not WebSockets (decided)".
