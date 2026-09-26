# 11. Armature's own OIDC issuer, roles and permissions in PostgreSQL

## Status

Accepted (recorded in INC-00b; decided in the plan, "Authentication and authorization")

## Context and Problem Statement

Shared boards, MCP clients, and A2A peers need authentication, and links (ADR-0004) need an
authorization decision. No enterprise identity provider is available to depend on yet, but one
(for example Microsoft Entra) should be adoptable later without a rewrite.

## Decision Drivers

- Standard OIDC and OAuth 2.1 from day one.
- No external identity provider dependency now.
- One authorization decision shared by links and API enforcement.

## Considered Options

- Armature's own authorization server (Spring Security 7) plus roles and permissions in
  PostgreSQL behind `ActorResolver` and `AccessPolicy`.
- An external provider now (Keycloak, Entra).
- Application managed sessions without OIDC.

## Decision Outcome

Chosen option: "Armature's own issuer behind two ports," because the authorization server ships
inside Spring Security 7 (no new dependency), everything else is a plain OIDC client or resource
server, and only the `identity` module knows the issuer is local.

### Consequences

- The UI signs in through a backend for frontend session cookie, which also authenticates SSE.
- `AccessPolicy` decides both which links appear and what method security allows, so the two
  cannot disagree.
- Refusals are the `authentication-required` (401) and `not-permitted` (403) problems.
- Switching to Entra is issuer configuration plus an `ActorResolver` adapter.

## More Information

`docs/plan/armature-plan.md`, "Authentication and authorization". First implemented in INC-01.
