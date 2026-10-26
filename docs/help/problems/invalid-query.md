---
type: https://jayhamilton.github.io/armature/problems/invalid-query
title: The query cannot be applied
status: 400
code: ARM-QUERY-400-INVALID
---

# The query cannot be applied

## What happened

A query parameter on a list or read request (`fields`, a filter, `sort`, `offset`, or `limit`) could not be applied. The problem's `errors` names the parameter, for example `/query/limit`.

## Why

Common causes: an attribute name the resource does not have (`sort=titel`), a `limit` over 100, a negative `offset`, a value that is not a whole number, or a list given to an operator that takes one value (`version.gt=1,2`). The `detail` lists the resource's known attributes when the name is the problem.

## What you can do

- Fix the parameter named in `errors` and send the request again.
- Use `fields=` with the attribute names the resource returns, and `sort=-lastUpdate` for newest first.
- Page through large collections with `offset` and `limit` (at most 100 at a time).
- The full rules are in the TMF 630 conformance page of the API documentation.

## For the assistant

Correct the parameter yourself when the fix is obvious (a misspelled attribute that matches a known one, a limit over 100), then retry once. Tell the user what you changed. If the intent is unclear, ask instead of guessing.
