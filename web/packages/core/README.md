# @armature/core

The framework free TypeScript core every Armature host shares, so behavior is written once and
Angular, React, and the embedding hosts only render it (plan, "Multi framework UI").

| Module | What it holds | Since |
| --- | --- | --- |
| [`type-registry.ts`](src/type-registry.ts) | `TypeRegistry`, the Strategy registry keyed by `@type` that gadgets, data sources, and channel renderers use | INC-00c |
| [`agent/`](src/agent) | The assistant's non visual half: AG-UI types, the SSE frame parser, the `streamChat` client, `buildAgentRequest`, the `AgentActions` port, and the ui part resolvers | INC-00e |
| [`mcp-apps/`](src/mcp-apps) | `loadMcpApp` (find a tool's `ui://` resource, read it, call the tool) and `mountMcpApp` (the official `AppBridge` in a sandboxed iframe) | INC-00e |
| [`a2ui/`](src/a2ui) | The `A2uiNode` type of the A2UI component catalog | INC-00e |

The HAL client, local first store, XState machines, and the rest arrive in later increments.

```bash
npm ci
npm run build          # tsc to dist/
npm test               # node:test on the compiled output
npm run catalog:check  # TypeScript half of docs/patterns/index.md is current
```

## How the assistant is split

A host's panel keeps the conversation state and draws it. Everything else is here:

1. `buildAgentRequest` turns the message, the selected board, and the gadget library into the
   request body. The library and the board's gadget titles ground the model's tool arguments in
   things that exist.
2. `streamChat` POSTs it and yields AG-UI events as they arrive. It uses `fetch` and the body
   stream, because `EventSource` can only send GET. `SseFrameParser` does the reassembly: a
   network chunk can end mid frame or carry several frames, so it keeps the unfinished tail for
   the next chunk, and it skips a malformed frame instead of ending the reply.
3. Each `CUSTOM` `ui-part` event goes to `resolveUiPart`, which looks the part's
   `componentType` up in a `TypeRegistry` of resolvers (a worked example in
   [`docs/patterns/strategy-registry.md`](../../../docs/patterns/strategy-registry.md)). A
   resolver acts through `AgentActions`, which each host implements with its own services, so a
   change made from chat goes through the same path as the same change made by hand.

To add a part type: write a resolver, register it in `createUiPartResolvers`, test it against
the fake in `fake-agent-actions.test-support.ts`, and give each host a card for it.

## Using core from a host

Hosts depend on `"@armature/core": "file:../../packages/core"` with `install-links=true` in their
`.npmrc`, so npm installs a packed copy of `dist` instead of a symlink. That way the MCP SDKs,
which core lists as peer dependencies, resolve to the host's own copies and are bundled once.
Build core before installing a host, and after changing core run `npm run core:refresh` in the
host (it rebuilds core and reinstalls the copy).

Core compiles with `moduleResolution: bundler`, as both hosts do, because the
`@modelcontextprotocol/ext-apps` type declarations use extensionless relative imports. The
emitted modules keep explicit `.js` imports, so Node runs the tests unchanged.

Pattern markers use the TSDoc tags `@pattern`, `@role`, and `@principle`, declared in
[`tsdoc.json`](tsdoc.json); `npm run catalog` lists them in `docs/patterns/index.md`.
