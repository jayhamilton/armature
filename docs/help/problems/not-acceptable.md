---
type: https://jayhamilton.github.io/armature/problems/not-acceptable
title: No acceptable representation
status: 406
code: ARM-MEDIA-406-NOT-ACCEPTABLE
---

# No acceptable representation

## What happened

The request's `Accept` header asked only for formats this resource cannot produce.

## Why

Resources are JSON (`application/json`); help pages are markdown (`text/markdown`) or JSON. HTML help is published on the user guide site, not served by the API.

## What you can do

- Send `Accept: application/json` for resources, or leave `Accept` out.
- For help pages, accept `text/markdown` or `application/json`.

## For the assistant

Retry with `Accept: application/json` (or `text/markdown` for help pages).
