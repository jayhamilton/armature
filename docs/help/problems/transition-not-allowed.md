---
type: https://jayhamilton.github.io/armature/problems/transition-not-allowed
title: This change is not allowed in the current state
status: 409
code: ARM-LIFECYCLE-409-NOT-ALLOWED
---

# This change is not allowed in the current state

## What happened

The resource's lifecycle state does not allow the requested change. The `detail` names the state and the event that was refused, for example locking a board that is still a draft.

## Why

Lifecycles are explicit state machines. Each state allows only some events: a `DRAFT` board can be published or discarded, a `PUBLISHED` board can be locked or archived, a `LOCKED` board can only be unlocked, and an `ARCHIVED` board allows nothing.

## What you can do

- Read the resource again to see its current `state`; someone may have changed it.
- From INC-02, follow only the links the resource offers: a change that is not linked is not allowed now.

## For the assistant

Explain the board's current state and which events it allows. Offer the allowed next step instead of retrying the refused one.
