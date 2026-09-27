# @armature/core

The framework free TypeScript core every Armature host shares, so behavior is written once and
Angular, React, and the embedding hosts only render it (plan, "Multi framework UI").

Today it holds one thing: [`TypeRegistry`](src/type-registry.ts), the Strategy registry keyed by
`@type` that gadgets, data sources, and channel renderers will use. The HAL client, local first
store, XState machines, and the rest arrive in later increments.

```bash
npm ci
npm run build          # tsc to dist/
npm test               # node:test on the compiled output
npm run catalog:check  # TypeScript half of docs/patterns/index.md is current
```

Pattern markers use the TSDoc tags `@pattern`, `@role`, and `@principle`, declared in
[`tsdoc.json`](tsdoc.json). Hosts do not consume this package yet; they move onto it in INC-04.
