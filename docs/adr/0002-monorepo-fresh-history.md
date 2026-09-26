# 2. One monorepo, created with fresh history

## Status

Accepted

## Context and Problem Statement

Armature's code lived across three separate repositories: `armature-ms` (the Spring Boot backend),
`armature-ui` (the Angular reference UI), and `armature-ui-react` (an in-progress React port). The
plan calls for a single domain layer reachable through multiple UI hosts, shared contracts between
them, and one increment report per pull request spanning whichever stacks it touches. Three
repositories make all of that awkward: a single change to a shared contract needs coordinated
commits and version pins across repos, and there is no one place to read "what shipped in this
increment."

## Decision Drivers

- The plan's "Repository layout" section already decides this: "Everything lives in one new
  repository... The current code is copied in without history."
- Increment reports need to describe changes spanning `backend/` and one or more `web/hosts/*` in
  one document.
- `contracts/` needs to be readable by every stack without cross-repo submodules or published
  packages.
- The three original repositories have real git history worth preserving as-is, not rewritten or
  filtered.

## Considered Options

- Keep three repositories, add a meta-repo or submodules to coordinate them.
- Merge the three repositories' histories into one, using `git subtree` or `git filter-repo`
  imports that preserve commit history.
- Create a new, empty repository and copy each source repository's current working tree into it,
  with no history import.

## Decision Outcome

Chosen option: "Create a new, empty repository and copy each source repository's current working
tree into it, with no history import," because it is the option the plan already commits to, it
avoids the complexity and risk of merging three unrelated commit graphs (different authors' dates,
unrelated root commits, no shared ancestor), and it keeps the original repositories fully intact
and citable for anyone who needs the history.

### Consequences

- `armature-ms`, `armature-ui`, and `armature-ui-react` keep their full git history and stay
  linked from the new repository's README as the historical record; they are not archived or
  deleted as part of this decision.
- The new repository, `armature-platform`, starts at a single baseline commit with no prior
  history of its own for the code it contains; `git blame` on anything copied in INC-00a will show
  this repository's own commits only, not the original authorship history. Anyone needing that
  context follows the README's links to the original repository.
- Per the plan's "Repository layout" section, once the team is comfortable, the old Angular
  repository is renamed and archived alongside the other two, and this repository is renamed from
  `armature-platform` to `armature`. That rename is out of scope for this decision and this
  increment.

## More Information

See `docs/plan/armature-plan.md`, "Repository layout," and `docs/increments/INC-00a.md` for what
was actually copied and excluded.
