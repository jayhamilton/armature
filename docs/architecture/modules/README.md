# Application modules

Module diagrams show that consolidation does not become a new monolith: each backend module has a
published API, declares which modules it may depend on, and is verified by a test.

**Generated, not drawn.** `ModuleDocumentationTest` (Spring Modulith `Documenter`) writes these
files from the same `ApplicationModules` that `ModularityTest` verifies
([ADR-0008](../../adr/0008-spring-modulith-in-process-events.md)):

| File | Contents |
| --- | --- |
| [`components.svg`](components.svg) | Every module and the dependencies between them |
| `module-<name>.svg` | One module and its direct neighbors |
| `module-<name>.adoc` | The module canvas: base package, Spring components, events, configuration |

To update after changing module structure:

```bash
cd backend && ./mvnw test -Dtest=ModuleDocumentationTest
cd .. && docs/architecture/render.sh
```

The Docs workflow fails if an SVG no longer matches its `.puml`
([ADR-0013](../../adr/0013-diagrams-as-code.md)).
