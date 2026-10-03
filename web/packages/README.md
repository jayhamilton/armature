# web/packages

Framework free packages shared by every UI host, per
[`docs/plan/armature-plan.md`](../../docs/plan/armature-plan.md#multi-framework-ui).

- **[`core`](core/README.md)** (started in INC-00c with the `@type` Strategy registry; the AG-UI
  stream client, ui part resolvers, and MCP Apps host bridge wrapper since INC-00e; grows through
  later increments): HAL client, local-first store
  and sync engine, board and capability models, XState machines, `when` clause evaluator, RFC 9457
  handling, AG-UI stream client, MCP Apps host bridge wrapper. Plain TypeScript, no framework.
- **`elements`** (arrives in INC-04): `<armature-board>`, `<armature-gadget-host>`,
  `<armature-assistant>`, `<armature-help>`, `<armature-problem>`, and the built-in gadgets, built
  with Lit.

`web/hosts/angular` and `web/hosts/react` are still framework native applications. Both use
`core` for the assistant since INC-00e, and migrate onto `elements` from INC-04.
