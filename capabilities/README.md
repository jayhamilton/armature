# Capabilities

Each directory here will be a mock service (Fiber, 5G, Device Management, Billing) that plugs
into Armature through a manifest, proving that adding a service is a manifest and a small server,
not a new portal ([ADR-0012](../docs/adr/0012-capability-manifests.md)).

**Boundary rule:** a capability may import only `contracts/`. It never imports `backend/` or
`web/` code; it reaches Armature over MCP, A2A, or HTTP like any third party would.

First capabilities arrive in INC-04 (data source strategies).
