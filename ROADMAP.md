# Roadmap

The full architecture and rationale live in [`docs/plan/armature-plan.md`](docs/plan/armature-plan.md);
this page is the increment table and demo scenario from that plan, kept short for quick reference.
Nothing here starts until the previous increment's report (`docs/increments/INC-nn.md`) is written.

## Increments

| Inc | Theme | Demo at the end | Vision outcome |
| --- | --- | --- | --- |
| 00a, 00b, 00c | Scaffold, docs and CI, modules and patterns | New repo builds and runs as before; ADRs and baseline C4; verified modules | All |
| 01 | Board resources (TMF 630) | Boards follow you from laptop to phone | Deliver anywhere |
| 02 | Board lifecycle and HATEOAS | Lock, publish, share appear only when the server offers the link | No assumptions |
| 03 | Agent on real state | "Build me a board for my services" with preview and undo | No assumptions |
| 04 | Data source strategies | Gadgets show live data from Fiber, 5G, Device Management, and Billing | Consolidation |
| 05 | Ask, answer, pin, return | A pinned answer refreshes itself next week | Return to information |
| 06 | Capability manifests | Register a service, its menus and gadgets appear; remove it, they vanish | Consolidation |
| 07 | MCP capabilities and MCP Apps as gadgets | A third party MCP server becomes a capability with zero Armature code | Consolidation |
| 08 | A2A agent | A peer agent asks Armature for a board and gets it back as an artifact | Deliver anywhere |
| 09 | Events and channels | Monday digest of a board posted to Teams and email | Deliver anywhere |
| 10 | Production shape and the demo | Side by side: traditional portals vs Armature, measured | The argument |

## Demo services and scenario

Four mock services stand in for a customer's portfolio, each built as a separate capability so the
demo proves consolidation rather than asserting it.

| Service | Contributes | Semantic type | TMF shaped API | Events |
| --- | --- | --- | --- | --- |
| Fiber | Connection health, outage timeline, repair ticket command | `Service`, `Observation` | TMF638 Service Inventory, TMF642 Alarm, TMF621 Trouble Ticket | `connection.degraded`, `outage.resolved` |
| 5G | Data usage, signal and coverage, failover lines | `Service`, `Observation` | TMF638 Service Inventory, TMF635 Usage | `usage.threshold.exceeded` |
| Device Management | Device inventory, firmware status, failover state, reboot command | `IndividualProduct` | TMF639 Resource Inventory | `device.failover`, `device.offline` |
| Billing | Statement, charges by service, anomaly explanation | `Invoice`, `Order` | TMF678 Customer Bill | `bill.issued`, `charge.anomaly` |

**The scenario:** a business customer asks *"Why was my bill higher this month, and is it related
to last week's fiber outage?"* The answer needs all four: Fiber shows the outage window, Device
Management shows the routers failing over, 5G shows the data usage spike during failover, and
Billing shows the resulting overage charge. In the traditional model that is four portals; in
Armature it is one question, one composed board, one pinned answer, and a Teams message when the
credit posts.
