# 18. Hosts install @armature/core as a packed copy, with shared SDKs as peer dependencies

## Status

Proposed (stubbed in INC-00e; needs review)

## Context and Problem Statement

INC-00e is the first increment in which the hosts import `@armature/core`. Core's MCP Apps code
needs `@modelcontextprotocol/sdk` and `@modelcontextprotocol/ext-apps`, which both hosts also use
directly. With a plain `file:` dependency, npm symlinks core into each host, and TypeScript and
the bundlers then resolve core's imports from core's own `node_modules`. The Angular build failed
because two copies of zod (one under core, one under the host) made the SDK's `Client` types
incompatible. Even where the types happen to match, the bundle would carry the SDKs twice. The
repository has no npm or pnpm workspace yet, and each host keeps its own lockfile.

## Decision Drivers

- One copy of each shared SDK in a host's bundle, and type checks that agree with it.
- No change to how each host is installed and built (its own `npm ci`, its own lockfile).
- Works the same on a developer machine and in CI.
- No new dependency or tool outside the policy table.

## Considered Options

- Symlinked `file:` dependency, with `preserveSymlinks` in Angular and `resolve.dedupe` in Vite.
- Packed copy: `file:` dependency with `install-links=true` in each host's `.npmrc`, and the SDKs
  as peer dependencies of core (also dev dependencies, for its own build and tests).
- Convert `web/` to an npm or pnpm workspace with hoisted dependencies.
- Keep the MCP Apps code out of core and leave it in each host.

## Decision Outcome

Chosen option: "Packed copy," because npm installs core's `dist` like any published package, so
its peer dependencies resolve to the host's own SDKs with no bundler specific configuration. The
cost is a refresh step: npm does not re-copy a `file:` dependency whose version has not changed,
so each host has `npm run core:refresh` (rebuild core, remove the copy, reinstall). CI builds core
before `npm ci` in each host.

### Consequences

- Good: the Angular bundle grew by 0.7 kB gzipped when it moved onto core; no SDK is duplicated.
- Good: hosts consume core exactly as they would a published package, which is the shape the
  embedding hosts (Lit, Svelte, vanilla) will need.
- Bad: a change in core is not picked up by a host until `core:refresh`; forgetting it gives stale
  behavior, not an error.
- Neutral: a workspace (the third option) remains possible later and would replace the refresh
  step; it changes every host's install and lockfile, so it is a decision of its own.

## More Information

`web/packages/core/README.md` ("Using core from a host"), `web/hosts/*/.npmrc`,
`docs/increments/INC-00e.md`.
