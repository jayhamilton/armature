---
type: https://jayhamilton.github.io/armature/problems/invalid-request
title: The request is not valid
status: 400
code: ARM-REQ-400-INVALID
---

# The request is not valid

## What happened

The request body, or a value in it, breaks a rule of the resource. Each rule broken is one entry in `errors`, with a JSON Pointer to the value (for example `/title` or `/rows/0/structure`).

## Why

A required value is missing (a board needs a title; a gadget instance needs its `@type`, board, and row), a value is not one of the allowed ones (a row layout, a content width), a gadget is placed in a column its row does not have, or the body is not readable JSON.

## What you can do

- Read each entry in `errors` and fix the value its pointer names.
- Row layouts are `one_col`, `one_col_full`, `two_col_equal`, `two_col_narrow_wide`, `two_col_wide_narrow`, `three_col_equal`, and `masonry`.
- Content widths are `full`, `normal`, and `narrow`.

## For the assistant

Fix every value listed in `errors` before retrying, and retry once. If a required value is missing and you cannot infer it from the conversation (for example the board's title), ask the user for it.
