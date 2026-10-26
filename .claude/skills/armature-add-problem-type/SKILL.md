---
name: armature-add-problem-type
description: Add an RFC 9457 problem type to Armature (ProblemType entry, exception, help page with the four required sections, and a test that produces it). Use when a new kind of error needs to reach clients, or when a capability contributes its own problem types.
---

# Add a problem type

Every error Armature returns is a problem whose `type` names a help page, so the error UI, the
user guide, and the assistant give the same answer (ADR-0019). A problem type is only done when
its catalog entry, its page, and a test that produces it all exist; `ProblemCatalogTest` checks
all three.

## First, check you need one

Reuse an existing type when the client would do the same thing about it. Read
`backend/src/main/java/com/addf/backend/armature/problem/ProblemType.java` and
`docs/help/problems/`. A new type is for a new remedy, not a new message: put occurrence detail in
`detail` and `errors[]` instead.

## Steps

1. **Name it.** A slug in kebab case that describes the situation (`board-version-conflict`), a
   `title` that never varies per occurrence, the HTTP status, and a stable code
   `ARM-<AREA>-<STATUS>-<WORD>`.
2. **Catalog entry.** Add the constant to `ProblemType`.
3. **Exception.** A subclass of `ProblemException` in the module that raises it, passing the type,
   a `detail` written for the person who hit it, and `FieldProblem`s with JSON Pointers when a
   value is at fault. Never build a `ProblemDetail` yourself; `ProblemAdvice` and `ProblemBuilder`
   do that, and `ProblemArchitectureTest` fails if anything else does.
4. **Help page.** `docs/help/problems/<slug>.md`, front matter matching the entry exactly:

   ```markdown
   ---
   type: https://jayhamilton.github.io/armature/problems/<slug>
   title: <title>
   status: <status>
   code: <code>
   ---
   ```

   then `# <title>` and the four sections `## What happened`, `## Why`, `## What you can do`,
   `## For the assistant`. Plain words, no dashes as punctuation (CLAUDE.md, "Documentation").
   The assistant section says how to answer without guessing and whether to retry.
5. **Test.** A test that makes the API return the problem and checks it with
   `ProblemAssertions.expectProblem`, annotated `@ProducesProblem("<slug>")`. Where no endpoint
   raises it yet, test `ProblemAdvice` directly, as `ProblemAdviceTest` does.
6. **Remediation links** (from INC-02): add the `_links` that let the user act on it in the
   current state.

## Checks (all must pass before reporting done)

```bash
cd backend && ./mvnw -q test -Dtest='ProblemCatalogTest,ProblemArchitectureTest,HelpApiTest'
cd backend && ./mvnw -q test
```

If any check fails, report which one and why; do not report the problem type as done.
