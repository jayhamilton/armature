---
type: https://jayhamilton.github.io/armature/problems/unsupported-media-type
title: The media type is not supported
status: 415
code: ARM-MEDIA-415-UNSUPPORTED
---

# The media type is not supported

## What happened

The request body's `Content-Type` is not one this operation accepts.

## Why

`POST` takes `application/json`. `PATCH` takes exactly two media types, as TMF 630 requires: `application/merge-patch+json` (RFC 7386) and `application/json-patch+json` (RFC 6902). Plain `application/json` is not a patch format.

## What you can do

- For `POST`, send `Content-Type: application/json`.
- For `PATCH`, send a merge patch (an object shaped like the resource, `null` to remove) with `application/merge-patch+json`, or a list of operations with `application/json-patch+json`.

## For the assistant

Set the right `Content-Type` and retry once. Prefer a merge patch for simple edits; use JSON Patch when you need `test` to guard against concurrent changes.
