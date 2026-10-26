---
type: https://jayhamilton.github.io/armature/problems/resource-not-found
title: The resource does not exist
status: 404
code: ARM-RES-404-NOT-FOUND
---

# The resource does not exist

## What happened

The request named a board, row, gadget instance, help page, or path that this deployment does not have.

## Why

The id may be mistyped, or the resource was deleted (by you on another device, by someone you share it with, or by the assistant). An `href` you stored earlier is still the right address: Armature never puts a version in a path, so a resource does not move when the server is upgraded.

## What you can do

- Check the id in the request against the `id` the API returned.
- List the collection (for example `GET /board`) to find the resource again.
- If you deleted it yourself, there is no undo yet; create it again.

## For the assistant

Say which resource was not found, using the problem's `detail`. Do not guess another id. Offer to list the collection so the user can choose, and never claim the resource exists.
