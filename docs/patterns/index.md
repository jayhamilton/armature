# Pattern catalog

Armature is teaching material: every class that implements a design pattern says so in code, and
this page is generated from those markers, so it always matches the source. Java types are marked
with `@DesignPattern` and `@SolidPrinciple`; TypeScript with the TSDoc tags `@pattern`, `@role`,
and `@principle`.

| Pattern | Page |
| --- | --- |
| Adapter | [adapter.md](adapter.md) |
| Builder | [builder.md](builder.md) |
| Interpreter and Specification | [interpreter-specification.md](interpreter-specification.md) |
| State | [state.md](state.md) |
| Strategy with registry | [strategy-registry.md](strategy-registry.md) |

Do not edit the sections below by hand. Regenerate them with:

- Java: `cd backend && ./mvnw test -Dtest=PatternCatalogTest -Dpatterns.write=true`
- TypeScript: `cd web/packages/core && npm run catalog`

CI fails when either section is out of date (`PatternCatalogTest` in the Backend workflow,
`npm run catalog:check` in the Web core workflow).

## Java

<!-- java-catalog:start -->
| Pattern | Role | Type | Principle |
| --- | --- | --- | --- |
| Adapter | Adapter | [`InMemoryBoardRepository`](../../backend/src/main/java/com/addf/backend/armature/board/internal/InMemoryBoardRepository.java) |  |
| Adapter | Target | [`BoardRepository`](../../backend/src/main/java/com/addf/backend/armature/board/BoardRepository.java) | Liskov substitution: Every adapter passes BoardRepositoryContract. |
| Builder | Builder | [`ProblemBuilder`](../../backend/src/main/java/com/addf/backend/armature/problem/ProblemBuilder.java) | Single responsibility: The only place a problem body is made. |
| Interpreter and Specification | AbstractExpression | [`Specification`](../../backend/src/main/java/com/addf/backend/armature/tmf/Specification.java) | Single responsibility: Decides whether a resource matches; nothing else. |
| Interpreter and Specification | NonterminalExpression | [`AllOf`](../../backend/src/main/java/com/addf/backend/armature/tmf/AllOf.java) |  |
| Interpreter and Specification | Parser | [`FilterParser`](../../backend/src/main/java/com/addf/backend/armature/tmf/FilterParser.java) |  |
| Interpreter and Specification | TerminalExpression | [`AnyOf`](../../backend/src/main/java/com/addf/backend/armature/tmf/AnyOf.java) |  |
| Interpreter and Specification | TerminalExpression | [`Compare`](../../backend/src/main/java/com/addf/backend/armature/tmf/Compare.java) |  |
| State | ConcreteState | [`Archived`](../../backend/src/main/java/com/addf/backend/armature/board/Archived.java) | Open/Closed: Archived refuses every event. |
| State | ConcreteState | [`Draft`](../../backend/src/main/java/com/addf/backend/armature/board/Draft.java) | Open/Closed: Draft allows only publish and discard. |
| State | ConcreteState | [`Locked`](../../backend/src/main/java/com/addf/backend/armature/board/Locked.java) | Open/Closed: Locked allows only unlock. |
| State | ConcreteState | [`Published`](../../backend/src/main/java/com/addf/backend/armature/board/Published.java) | Open/Closed: Published allows only lock and archive. |
| State | Context | [`BoardLifecycle`](../../backend/src/main/java/com/addf/backend/armature/board/BoardLifecycle.java) | Open/Closed: Delegates every decision to the current state. |
| State | Context | [`LifecycleEngine`](../../backend/src/main/java/com/addf/backend/armature/lifecycle/LifecycleEngine.java) | Dependency inversion: Callers depend on this port, not on a lifecycle's concrete states. |
| State | State | [`BoardState`](../../backend/src/main/java/com/addf/backend/armature/board/BoardState.java) | Open/Closed: A new board state is a new class; no existing state changes. |
| Strategy with registry | ConcreteStrategy | [`JsonPatch`](../../backend/src/main/java/com/addf/backend/armature/tmf/JsonPatch.java) |  |
| Strategy with registry | ConcreteStrategy | [`MergePatch`](../../backend/src/main/java/com/addf/backend/armature/tmf/MergePatch.java) |  |
| Strategy with registry | Registry | [`PatchStrategies`](../../backend/src/main/java/com/addf/backend/armature/tmf/PatchStrategies.java) |  |
| Strategy with registry | Strategy | [`PatchStrategy`](../../backend/src/main/java/com/addf/backend/armature/tmf/PatchStrategy.java) | Open/Closed: A new patch format is a new class. |
<!-- java-catalog:end -->

## TypeScript

<!-- ts-catalog:start -->
| Pattern | Role | Symbol | Principle |
| --- | --- | --- | --- |
| Strategy with registry | ConcreteStrategy | [`resolveA2uiCard`](../../web/packages/core/src/agent/ui-part-resolvers.ts) | Open/Closed: one part type, registered by its componentType. |
| Strategy with registry | ConcreteStrategy | [`resolveBoardList`](../../web/packages/core/src/agent/ui-part-resolvers.ts) | Open/Closed: one part type, registered by its componentType. |
| Strategy with registry | ConcreteStrategy | [`resolveGadgetMove`](../../web/packages/core/src/agent/ui-part-resolvers.ts) | Open/Closed: one part type, registered by its componentType. |
| Strategy with registry | ConcreteStrategy | [`resolveGadgetRemove`](../../web/packages/core/src/agent/ui-part-resolvers.ts) | Open/Closed: one part type, registered by its componentType. |
| Strategy with registry | ConcreteStrategy | [`resolveGadgetSuggestion`](../../web/packages/core/src/agent/ui-part-resolvers.ts) | Open/Closed: one part type, registered by its componentType. |
| Strategy with registry | ConcreteStrategy | [`resolveRowAdd`](../../web/packages/core/src/agent/ui-part-resolvers.ts) | Open/Closed: one part type, registered by its componentType. |
| Strategy with registry | ConcreteStrategy | [`resolveRowLayout`](../../web/packages/core/src/agent/ui-part-resolvers.ts) | Open/Closed: one part type, registered by its componentType. |
| Strategy with registry | Registry | [`TypeRegistry`](../../web/packages/core/src/type-registry.ts) | Open/Closed: a new `@type` is a new registration; callers never branch on type. |
<!-- ts-catalog:end -->
