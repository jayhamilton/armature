---
type: https://jayhamilton.github.io/armature/problems/internal-error
title: Something went wrong on our side
status: 500
code: ARM-500-INTERNAL
---

# Something went wrong on our side

## What happened

The server could not complete the request because of a fault in Armature, not in the request.

## Why

An unexpected error. The details are in the server log under the problem's `traceId`; they are never sent to the client, because they can include internal information.

## What you can do

- Try again in a moment.
- If it keeps happening, report it with the `traceId` and the time.

## For the assistant

Tell the user the request failed on the server's side, give the `traceId`, and do not retry more than once. Do not speculate about the cause.
