# Help catalog

One help catalog feeds the in app help panel, the public user guide, and the assistant, so people and agents get the same answer.

| Section | Holds | Read by |
| --- | --- | --- |
| [`problems/`](problems/) | One page per RFC 9457 problem type the API can return ([ADR-0019](../adr/0019-rfc9457-problem-details.md)) | The backend at `/help/problems/<slug>` (each problem's `_links.help`); the user guide site from INC-01d |
| [`gadgets/`](gadgets/) | One page per built in gadget | Each host's help panel (copied into the host's assets by `npm run help:copy`, which runs on install and build); the backend at `/help/gadgets/<slug>` |
| `tasks/`, `concepts/` | How to guides and explanations | Arrive as pages are written |

The backend build copies this folder onto its classpath, so the API always serves the pages it was built with.

## Problem pages

The file name is the problem's slug, which is also the last segment of its `type` URI
(`https://jayhamilton.github.io/armature/problems/<slug>`). Each page starts with front matter that
must match the backend's `ProblemType` entry, then four sections:

```markdown
---
type: https://jayhamilton.github.io/armature/problems/invalid-query
title: The query cannot be applied
status: 400
code: ARM-QUERY-400-INVALID
---

# The query cannot be applied

## What happened
## Why
## What you can do
## For the assistant
```

`ProblemCatalogTest` fails the backend build when a page and its `ProblemType` disagree, when a
section is missing, when either side has no counterpart, or when no test produces the problem.
Add a problem type with the `armature-add-problem-type` skill, which writes all of these together.

Write for the person who just hit the error: what happened in plain words, why it happens, the
steps that fix it, and (for the assistant) how to answer without guessing.
