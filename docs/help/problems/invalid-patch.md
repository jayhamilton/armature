---
type: https://jayhamilton.github.io/armature/problems/invalid-patch
title: The patch cannot be applied
status: 422
code: ARM-PATCH-422-INVALID
---

# The patch cannot be applied

## What happened

A `PATCH` request was understood but could not be applied. Nothing was changed: patches apply all or nothing.

## Why

The patch is malformed (a merge patch that is not an object, a JSON Patch that is not an array, an unknown `op`), a JSON Patch `test` failed because the resource changed, a `path` points at nothing, or the patch changes an attribute that cannot be changed this way (`id`, `href`, `@type`, `state`, `version`, timestamps, or a nested resource with its own address, such as a board's `rows`). The `errors` pointers name the failing part.

## What you can do

- For a failed `test`, read the resource again, then rebuild the patch from what you read.
- To change rows, patch the row (`PATCH /board/{id}/row/{rowId}`); to move a gadget, patch the gadget instance.
- State changes such as publish and lock arrive as links in INC-02; they are not attribute edits.

## For the assistant

Do not retry the same patch. Read the resource again and build a new patch against it. If `errors` says an attribute cannot be changed, explain which resource or link changes it instead.
