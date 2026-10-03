# Sequence diagrams

Sequences show one user visible scenario end to end (for example ask, answer, pin, return), so a reader can see how a question becomes a pinned, live gadget without reading the code.

PlantUML `.puml` with a rendered `.svg` next to it; participant names match class or service names ([ADR-0013](../../adr/0013-diagrams-as-code.md)). 

| Sequence | Shows | Since |
| --- | --- | --- |
| [Assistant chat](assistant-chat.svg) ([source](assistant-chat.puml)) | One message streamed from `/api/agent/chat`, a ui part resolved by the core registry, and the host's `AgentActions` changing the board | INC-00e |

*Board sync* arrives in INC-01.
