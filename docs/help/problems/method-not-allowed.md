---
type: https://jayhamilton.github.io/armature/problems/method-not-allowed
title: This method is not allowed here
status: 405
code: ARM-METHOD-405-NOT-ALLOWED
---

# This method is not allowed here

## What happened

The path exists, but not with this HTTP method, for example `PUT /board/{id}`.

## Why

Armature resources follow TMF 630: `GET` to read, `POST` to a collection to create, `PATCH` to change, `DELETE` to remove. Whole resource replacement with `PUT` is not offered. The response's `Allow` header lists what the path accepts.

## What you can do

- Use one of the methods in the `Allow` header.
- To change part of a resource, send `PATCH` with `application/merge-patch+json` or `application/json-patch+json`.

## For the assistant

Switch to a method from the `Allow` header and retry once. Use `PATCH` with a merge patch for edits.
