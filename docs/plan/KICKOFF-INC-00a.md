# Kickoff prompt: INC-00a Scaffold the new repository

Open Claude Code in `~/Development/armature-platform` and paste the prompt below.
Start the session in plan mode so it proposes before it acts.

---

```text
We are starting INC-00a from docs/plan/armature-plan.md. Read CLAUDE.md and the plan first,
especially "Repository layout", "Multi framework UI", and "INC-00a Scaffold the new repository".

Goal: turn this folder into the armature-platform monorepo by copying the current code in,
without history and without changing behavior.

Sources (read only; do not run any git command inside them, copy with rsync or cp only):
- ../armature-ms         -> backend/
- ../armature-ui         -> web/hosts/angular/
- ../armature-ui-react   -> web/hosts/react/

Copy the working tree of each source (all pending work, including armature-ms's ChartsApp files, is
already committed there).
Exclude: .git, node_modules, dist, target, .angular, .DS_Store, .claude/settings.local.json,
.claude/worktrees, and anything else that is build output or machine specific.
List any file you are unsure about (for example .vscode, .work, .agent-pipeline.json)
and ask me rather than deciding.

Then:
1. git init on branch main, create branch inc/00a-scaffold.
2. Root files: README.md (vision in a paragraph, layout, how to run each stack, links to the three
   original repositories for their history), ROADMAP.md (the increment table and demo scenario from
   the plan), .gitignore, pnpm-workspace.yaml (web/packages/*, web/hosts/*), empty contracts/,
   capabilities/, and web/packages/ with a README each.
3. Fix references that break after the move: README links between the UI and the microservice,
   documentation image links, the Angular GitHub workflow (move it to .github/workflows with a
   paths filter and working-directory), and paths in web/hosts/angular/.agent-pipeline.json.
4. docs/adr/0001-record-architecture-decisions.md and docs/adr/0002-monorepo-fresh-history.md (MADR).
5. Verify: backend tests pass; the Angular and React hosts build; the Angular host runs against the
   backend as before. Record the exact commands and results.
6. Write docs/increments/INC-00a.md from the report template in the plan.

Do not start INC-00b. Do not push. First, write the spec to .work/specs/SPEC-INC-00a.md and wait
for my approval.
```

---

After it finishes: read `docs/increments/INC-00a.md`, run the app yourself, then create the GitHub
repository `armature-platform` (private until you have reviewed it) and push.
