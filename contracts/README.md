# Contracts

Contracts are the single definitions every stack reads, so the backend, every web host, and every
capability agree on what a board, a lifecycle, or an event is without copying it.

Planned contents: `lifecycles/*.json` (machine definitions tested against the Java engine, the
XState machines, and the link rules), JSON Schemas for gadgets, events, and capability manifests,
and the link relation catalog.

**Boundary rule:** contracts depend on nothing else in this repository. Every stack may read them.

Content arrives from INC-01 onward, as resources, lifecycles, and link relations are defined.
