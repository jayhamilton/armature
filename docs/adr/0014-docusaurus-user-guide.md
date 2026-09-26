# 14. Docusaurus user guide over docs/help

## Status

Accepted (recorded in INC-00b; decided in the plan, "User guide site")

## Context and Problem Statement

Help content (gadgets, problems, tasks, concepts) must reach three consumers: the in app help
panel, a public user guide, and the assistant through MCP resources. Problem `type` URIs also need
a stable public home on GitHub Pages.

## Decision Drivers

- One markdown source, three outputs; nothing written twice.
- Stable routes matching problem type identifiers.
- Structured data (JSON-LD) for agents.
- Dependency policy (ADR-0005).

## Considered Options

- Docusaurus, published to GitHub Pages.
- MkDocs.
- A hand built static site.

## Decision Outcome

Chosen option: "Docusaurus," because it is Meta maintained, reads markdown and MDX from the same
files the help panel uses, supports versioned docs that follow `engines.armature`, deploys to
GitHub Pages, and being React based can render live `@armature/elements` gadgets in MDX.

### Consequences

- `docs/help` builds to `jayhamilton.github.io/armature`; `problems/` pages publish at exactly
  the paths used in `type` URIs, and a CI check fails if a catalog entry has no page.
- Each page emits JSON-LD from its front matter.
- The repository must be renamed to `armature` before INC-01 publishes the first problem pages.

## More Information

`docs/plan/armature-plan.md`, "User guide site". First built in INC-01.
