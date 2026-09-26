# Architecture

Architecture documentation lets a reviewer check each increment against the vision by reading
diagrams and decisions rather than diffs (the plan's guardrail 7).

| Directory or file | Contents |
| --- | --- |
| [`c4/`](c4/README.md) | C4 context and container views, current and target |
| [`sequences/`](sequences/README.md) | PlantUML sequences per user visible scenario |
| [`state/`](state/README.md) | State diagrams generated from lifecycle definitions |
| [`modules/`](modules/README.md) | Spring Modulith module diagrams and canvases |
| [`dependency-audit.md`](dependency-audit.md) | A verdict for every direct dependency under ADR-0005 |
| `render.sh`, `check-svg.sh`, `plantuml.sh` | Render diagrams and check that committed SVGs are current |

Rendering needs Java 17 or later on the path (or `JAVA_HOME`) and downloads a pinned PlantUML jar
into `.cache/plantuml/` on first use.
