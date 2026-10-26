# Sequence diagrams

Sequences show one user visible scenario end to end (for example ask, answer, pin, return), so a reader can see how a question becomes a pinned, live gadget without reading the code.

PlantUML `.puml` with a rendered `.svg` next to it; participant names match class or service names ([ADR-0013](../../adr/0013-diagrams-as-code.md)). 

| Sequence | Shows | Since |
| --- | --- | --- |
| [Assistant chat](assistant-chat.svg) ([source](assistant-chat.puml)) | One message streamed from `/api/agent/chat`, a ui part resolved by the core registry, and the host's `AgentActions` changing the board | INC-00e |
| [Board resources](board-resources.svg) ([source](board-resources.puml)) | A board created and a gadget placed through the TMF 630 resources, then a stale JSON Patch refused as an RFC 9457 problem whose help link resolves | INC-01a |

*Board sync* (the local first UI against these resources) arrives in INC-01d.
